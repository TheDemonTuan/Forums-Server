import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../db/user/user.service";
import { PasswordDto } from "./dto/password.dto";
import * as bcrypt from "bcrypt";
import { CacheService } from "../cache/cache.service";
import { $Enums, Prisma, User } from "@prisma/client";
import { PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";
import { ProfileDto } from "./dto/profile.dto";
import { ConfigService } from "@nestjs/config";
import { UserTokenService } from "../db/user-token/user-token.service";
import { Session } from "./interfaces/sessions.interface";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import * as fs from "fs";
import { SharpFile } from "@/common/pipes/sharp.pipe";
import { join } from "path";

@Injectable()
export class AccountService {
	constructor(
		private readonly usersService: UserService,
		private readonly userTokensService: UserTokenService,
		private readonly cacheService: CacheService,
		private readonly configService: ConfigService,
		private readonly httpService: HttpService
	) {}

	public async password(passwordDto: PasswordDto, userInfo: User, currentUTID: string) {
		if (passwordDto?.new_password !== passwordDto?.confirm_new_password) {
			throw new BadRequestException("New password and confirm new password do not match");
		} else if (!userInfo) {
			throw new UnauthorizedException("Invalid user token");
		} else if (!bcrypt.compareSync(passwordDto?.old_password, userInfo?.password)) throw new BadRequestException("Old password is incorrect");

		const newUserInfo = await this.usersService.update({
			data: {
				password: bcrypt.hashSync(passwordDto?.new_password, 11),
			},
			where: {
				id: userInfo?.id,
			},
		});

		await Promise.all([this.cacheService.setUserInfo(newUserInfo), this.sessionRevokeAll(userInfo?.id, currentUTID)]);

		return newUserInfo;
	}

	public async privateUserName(privateUserNameDto: PrivateUserNameDto, userInfo: User) {
		if (privateUserNameDto?.new_username === userInfo?.username) {
			throw new BadRequestException("New username cannot be the same as your current username");
		} else if (userInfo?.oauth === $Enums.OAuthProvider.DEFAULT && !bcrypt.compareSync(privateUserNameDto?.confirm_password, userInfo?.password)) {
			throw new BadRequestException("Confirm password is incorrect");
		} else if (await this.usersService.findUnique({ where: { username: privateUserNameDto?.new_username } })) {
			throw new BadRequestException("New username is already taken");
		}

		const newUserInfo = await this.usersService.update({
			data: {
				username: privateUserNameDto?.new_username,
			},
			where: {
				id: userInfo?.id,
			},
		});

		await this.cacheService.setUserInfo(newUserInfo);

		return newUserInfo;
	}

	public async privateEmail(privateEmailDto: PrivateEmailDto, userInfo: User) {
		if (privateEmailDto?.new_email === userInfo?.email) {
			throw new BadRequestException("New email cannot be the same as your current email");
		} else if (!bcrypt.compareSync(privateEmailDto?.confirm_password, userInfo?.password)) {
			throw new BadRequestException("Confirm password is incorrect");
		} else if (await this.usersService.findUnique({ where: { email: privateEmailDto?.new_email } })) {
			throw new BadRequestException("New email is already taken");
		}

		const updateUserInfo = await this.usersService.update({
			data: {
				email: privateEmailDto?.new_email,
			},
			where: {
				id: userInfo?.id,
			},
		});

		await this.cacheService.setUserInfo(updateUserInfo);

		return updateUserInfo;
	}

	public async public(profileDto: ProfileDto, file: SharpFile, userInfo: User) {
		if (userInfo?.display_name === profileDto?.display_name && userInfo?.about === profileDto?.about && !file?.staticPath) {
			if (fs.existsSync(file?.hostPath)) fs.unlinkSync(file?.hostPath);
			throw new BadRequestException("Nothing to update");
		}

		try {
			if (
				(await this.usersService.findUnique({ where: { display_name: profileDto?.display_name } })) &&
				userInfo?.display_name !== profileDto?.display_name
			) {
				if (fs.existsSync(file?.hostPath)) fs.unlinkSync(file?.hostPath);
				throw new BadRequestException("Display name is already taken");
			}

			const updateUserInfo = await this.usersService.update({
				data: {
					avatar: file?.staticPath ?? userInfo?.avatar,
					display_name: profileDto?.display_name,
					about: profileDto?.about,
				},
				where: {
					id: userInfo?.id,
				},
			});

			const oldAvatarPath = join(this.configService.get<string>("UPLOADED_FILES_DESTINATION"), userInfo?.avatar);

			if (fs.existsSync(oldAvatarPath) && file?.staticPath) fs.unlinkSync(oldAvatarPath);

			await this.cacheService.setUserInfo(updateUserInfo);
			return updateUserInfo;
		} catch (err) {
			if (file?.hostPath) fs.unlinkSync(file?.hostPath);
			throw err;
		}
	}

	public async sessions(currentUIID: string, currentUTID: string) {
		const userTokens = (await this.userTokensService.findMany({
			where: {
				user_id: currentUIID,
			},
			orderBy: {
				created_at: "desc",
			},
		})) as Session[];

		const userTokensCache = await this.cacheService.getUserTokens(currentUIID);

		userTokens.map((userToken) => {
			userToken.is_active = userTokensCache?.[userToken?.id] ? true : false;
		});

		return [
			...userTokens.filter((userToken) => userToken?.id === currentUTID),
			...userTokens.filter((userToken) => (userToken?.is_active && userToken?.id !== currentUTID) || !userToken?.is_active),
		] as Session[];
	}

	public async session(currentUIID: string, currentUTID: string, utid: string) {
		if (!utid) throw new BadRequestException("Invalid session id");

		let is_active = false;
		const userTokenCache = await this.cacheService.getUserToken(currentUIID, utid);

		if (userTokenCache) {
			is_active = true;
		} else {
			const userTokenDB = await this.userTokensService.findUnique({
				where: {
					id: utid,
					user_id: currentUIID,
				},
			});

			if (!userTokenDB) throw new BadRequestException("Invalid session id");

			return { ...userTokenDB, is_active, is_current: userTokenDB?.id === currentUTID };
		}

		return { ...userTokenCache, is_active, is_current: userTokenCache?.id === currentUTID };
	}

	public async sessionIp(ip: string) {
		if (!ip) throw new BadRequestException("Invalid ip address");

		const { data } = await firstValueFrom(
			this.httpService
				.get(`http://ip-api.com/json/${ip}?lang=en&fields=66846719`, {
					withCredentials: false,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Credentials": true,
					},
				})
				.pipe(
					catchError((err: AxiosError) => {
						throw new BadRequestException("Cannot get ip info");
					})
				)
		);
		return data;
	}

	public async sessionRevoke(currentUIID: string, currentUTID: string, utid: string) {
		if (!utid) throw new BadRequestException("Invalid session id");

		if (currentUTID === utid) throw new BadRequestException("Cannot revoke current session");

		try {
			await this.userTokensService.delete({
				id: utid,
				user_id: currentUIID,
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError) {
				if (err.code === "P2025") {
					throw new BadRequestException("Invalid session id");
				} else throw err;
			} else throw err;
		}

		this.cacheService.delUserToken(currentUIID, utid);

		return { message: "Session revoked" };
	}

	public async sessionRevokeAll(currentUIID: string, currentUTID: string) {
		await this.userTokensService.deleteMany({
			user_id: currentUIID,
			NOT: {
				id: currentUTID,
			},
		});

		await this.cacheService.delUserTokens(currentUIID);

		return { message: "All sessions revoked" };
	}
}
