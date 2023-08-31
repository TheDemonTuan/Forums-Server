import { BadRequestException, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { User, UserToken } from "@prisma/client";
import { UserTokensService } from "../db/user-tokens/user-tokens.service";
import { UsersService } from "../db/users/users.service";
import { CacheService } from "../cache/cache.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, firstValueFrom } from "rxjs";
import {
	GoogleOAuthTokenResponse,
	GoogleOAuthUserInfoResponse,
} from "./types/google-oauth-response.type";
import {
	GithubOAuthTokenResponse,
	GithubOAuthUserInfoResponse,
} from "./types/github-oauth-response.type";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly userTokensService: UserTokensService,
		private readonly cacheService: CacheService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService
	) {}

	private async createLoginSession(ip: string, userInfo: User) {
		const userToken: UserToken = await this.userTokensService.createToken(ip, userInfo?.id);
		await this.cacheService.setUTAUI(userInfo, userToken);

		const { password, ...newUserInfo } = userInfo;

		return {
			utid: userToken?.id,
			userInfo: newUserInfo,
		};
	}

	public async login(loginDto: LoginDto, ip: string) {
		const userInfo = await this.usersService.findUnique({
			username: loginDto?.username,
		});

		if (!userInfo || userInfo?.oauth !== "DEFAULT") {
			throw new BadRequestException("Invalid username or password");
		}

		const passwordMatch = await bcrypt.compare(loginDto?.password, userInfo?.password);

		if (!passwordMatch) {
			throw new BadRequestException("Invalid username or password");
		}

		return await this.createLoginSession(ip, userInfo);
	}

	public async register(registerDto: RegisterDto, ip: string) {
		const user = await this.usersService.findFirst({
			where: {
				OR: [{ email: registerDto.email }, { username: registerDto.username }],
			},
		});

		if (user) {
			throw new BadRequestException("User already exists");
		}

		const userInfo = await this.usersService.create({
			...registerDto,
			password: await bcrypt.hash(registerDto.password, 11),
		});

		return await this.createLoginSession(ip, userInfo);
	}

	public async googleOAuth(code: string, ip: string) {
		//? Get token from code
		const { data: googleToken } = await firstValueFrom(
			this.httpService
				.post<GoogleOAuthTokenResponse>("https://oauth2.googleapis.com/token", {
					code,
					client_id: this.configService.get<string>("GOOGLE_CLIENT_ID"),
					client_secret: this.configService.get<string>("GOOGLE_CLIENT_SECRET"),
					redirect_uri: this.configService.get<string>("GOOGLE_CALLBACK_URI"),
					grant_type: "authorization_code",
				})
				.pipe(
					catchError((err) => {
						throw new BadRequestException("Invalid code");
					})
				)
		);
		//? Get user info from token
		const { data: googleInfo } = await firstValueFrom(
			this.httpService
				.get<GoogleOAuthUserInfoResponse>("https://www.googleapis.com/oauth2/v2/userinfo", {
					headers: {
						Authorization: `${googleToken?.token_type} ${googleToken?.access_token}`,
					},
				})
				.pipe(
					catchError((err) => {
						throw new BadRequestException("Invalid code");
					})
				)
		);
		if (!googleInfo?.verified_email) {
			throw new BadRequestException("Email not verified");
		}

		//! Logic
		let userInfo = await this.usersService.findUnique({
			email: googleInfo?.email,
		});

		if (userInfo) {
			if (userInfo.oauth !== "GOOGLE") throw new BadRequestException("Email already exists");
		} else {
			userInfo = await this.usersService.create({
				email: googleInfo?.email,
				username: randomBytes(15).toString("hex"),
				oauth: "GOOGLE",
				avatar: googleInfo?.picture,
			});
		}

		return await this.createLoginSession(ip, userInfo);
	}

	public async githubOAuth(code: string, ip: string) {
		const { data: githubToken } = await firstValueFrom(
			this.httpService
				.post<GithubOAuthTokenResponse>(
					"https://github.com/login/oauth/access_token",
					{
						code,
						client_id: this.configService.get<string>("GITHUB_CLIENT_ID"),
						client_secret: this.configService.get<string>("GITHUB_CLIENT_SECRET"),
					},
					{
						headers: {
							Accept: "application/json",
						},
					}
				)
				.pipe(
					catchError((err) => {
						throw new BadRequestException("Invalid code");
					})
				)
		);

		const { data: githubInfo } = await firstValueFrom(
			this.httpService
				.get<GithubOAuthUserInfoResponse>("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${githubToken?.access_token}`,
					},
				})
				.pipe(
					catchError((err) => {
						throw new BadRequestException("Invalid code");
					})
				)
		);

		let userInfo = await this.usersService.findUnique({
			email: githubInfo?.email,
		});

		if (userInfo) {
			if (userInfo.oauth !== "GITHUB") throw new BadRequestException("Email already exists");
		} else {
			userInfo = await this.usersService.create({
				email: githubInfo?.email,
				username: randomBytes(15).toString("hex"),
				oauth: "GITHUB",
				avatar: githubInfo?.avatar_url,
			});
		}

		return await this.createLoginSession(ip, userInfo);
	}
}
