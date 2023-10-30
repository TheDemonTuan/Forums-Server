import { BadRequestException, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { $Enums, User } from "@prisma/client";
import { UserService } from "../../common/db/user/user.service";
import { CacheService } from "../cache/cache.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, firstValueFrom } from "rxjs";
import {
  GoogleOAuthTokenResponse,
  GoogleOAuthUserInfoResponse,
} from "./interfaces/google-oauth.interface";
import {
  GithubOAuthTokenResponse,
  GithubOAuthUserInfoResponse,
} from "./interfaces/github-oauth.interface";
import { AxiosError } from "axios";
import generateRandomAlphanumeric from "@/common/lib/random-alphanumeric";
import { Request } from "express";
import { CustomDBService } from "../../common/db/custom/custom-db.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly customDBService: CustomDBService
  ) {}

  private async createLoginSession(userInfo: User, req: Request) {
    const ip = req?.currentIp;
    const ua = req?.currentUA;

    if (!ip || !ua || !userInfo)
      throw new BadRequestException("Invalid request");

    const userToken = await this.customDBService.createLoginSession(
      userInfo?.id,
      req
    );

    await this.cacheService.setUTAUI(userInfo, userToken);
    return { ...userInfo, utid: userToken?.id };
  }

  public async login(loginDto: LoginDto, req: Request) {
    const userInfo = await this.usersService.findUnique({
      where: {
        username: loginDto?.username,
      },
    });

    if (!userInfo || userInfo?.oauth !== $Enums.OAuthProvider.DEFAULT) {
      throw new BadRequestException("Invalid username or password");
    }

    const passwordMatch = await bcrypt.compare(
      loginDto?.password,
      userInfo?.password
    );

    if (!passwordMatch) {
      throw new BadRequestException("Invalid username or password");
    }

    return await this.createLoginSession(userInfo, req);
  }

  public async register(registerDto: RegisterDto, req: Request) {
    const user = await this.usersService.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
    });

    if (user) {
      throw new BadRequestException("This email or username already exists");
    }

    const userInfo = await this.usersService.create({
      ...registerDto,
      password: await bcrypt.hash(registerDto.password, 11),
    });

    return await this.createLoginSession(userInfo, req);
  }

  public async googleOAuth(code: string, req: Request) {
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
          catchError((err: AxiosError) => {
            throw new BadRequestException("Invalid code");
          })
        )
    );
    //? Get user info from token
    const { data: googleInfo } = await firstValueFrom(
      this.httpService
        .get<GoogleOAuthUserInfoResponse>(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `${googleToken?.token_type} ${googleToken?.access_token}`,
            },
          }
        )
        .pipe(
          catchError((err: AxiosError) => {
            throw new BadRequestException("Invalid code");
          })
        )
    );
    if (!googleInfo?.verified_email) {
      throw new BadRequestException("Email not verified");
    }

    //! Logic
    let userInfo = await this.usersService.findUnique({
      where: {
        email: googleInfo?.email,
      },
    });

    if (userInfo) {
      if (userInfo.oauth !== $Enums.OAuthProvider.GOOGLE)
        throw new BadRequestException("This email already exists");
    } else {
      userInfo = await this.usersService.create({
        email: googleInfo?.email,
        username: generateRandomAlphanumeric(15),
        oauth: $Enums?.OAuthProvider?.GOOGLE,
        avatar: googleInfo?.picture,
      });
    }

    return await this.createLoginSession(userInfo, req);
  }

  public async githubOAuth(code: string, req: Request) {
    const { data: githubToken } = await firstValueFrom(
      this.httpService
        .post<GithubOAuthTokenResponse>(
          "https://github.com/login/oauth/access_token",
          {
            code,
            client_id: this.configService.get<string>("GITHUB_CLIENT_ID"),
            client_secret: this.configService.get<string>(
              "GITHUB_CLIENT_SECRET"
            ),
          },
          {
            headers: {
              Accept: "application/json",
            },
          }
        )
        .pipe(
          catchError((err: AxiosError) => {
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
          catchError((err: AxiosError) => {
            throw new BadRequestException("Invalid code");
          })
        )
    );

    let userInfo = await this.usersService.findUnique({
      where: {
        email: githubInfo?.email,
      },
    });

    if (userInfo) {
      if (userInfo.oauth !== $Enums.OAuthProvider.GITHUB)
        throw new BadRequestException("This email already exists");
    } else {
      userInfo = await this.usersService.create({
        email: githubInfo?.email,
        username: generateRandomAlphanumeric(15),
        oauth: $Enums?.OAuthProvider?.GITHUB,
        avatar: githubInfo?.avatar_url,
      });
    }

    return await this.createLoginSession(userInfo, req);
  }
}
