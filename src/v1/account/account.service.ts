import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../db/users/users.service";
import { PasswordDto } from "./dto/password.dto";
import * as bcrypt from "bcrypt";
import { CacheService } from "../cache/cache.service";
import { $Enums, User } from "@prisma/client";
import { PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { ProfileDto } from "./dto/profile.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AccountService {
	constructor(
		private readonly usersService: UsersService,
		private readonly cacheService: CacheService,
		private readonly configService: ConfigService
	) { }

	public async password(passwordDto: PasswordDto, userInfo: User) {
		if (passwordDto?.new_password !== passwordDto?.confirm_new_password) {
			throw new BadRequestException("New password and confirm new password do not match");
		} else if (!userInfo) {
			throw new UnauthorizedException("Invalid user token");
		} else if (!bcrypt.compareSync(passwordDto?.old_password, userInfo?.password))
			throw new BadRequestException("Old password is incorrect");

		const newUserInfo = await this.usersService.update({
			data: {
				password: bcrypt.hashSync(passwordDto?.new_password, 11),
			},
			where: {
				id: userInfo?.id,
			},
		});

		await this.cacheService.setUserInfo(newUserInfo);

		return newUserInfo;
	}

	public async privateUserName(privateUserNameDto: PrivateUserNameDto, userInfo: User) {
		if (privateUserNameDto?.new_username === userInfo?.username) {
			throw new BadRequestException("New username cannot be the same as your current username");
		} else if (
			userInfo?.oauth === $Enums.OAuthProvider.DEFAULT &&
			!bcrypt.compareSync(privateUserNameDto?.confirm_password, userInfo?.password)
		) {
			throw new BadRequestException("Confirm password is incorrect");
		} else if (await this.usersService.findUnique({ username: privateUserNameDto?.new_username })) {
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
		} else if (await this.usersService.findUnique({ email: privateEmailDto?.new_email })) {
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

	public async public(profileDto: ProfileDto, userInfo: User) {

		if (await this.usersService.findUnique({ display_name: profileDto?.display_name }) && userInfo?.display_name !== profileDto?.display_name) {
			throw new BadRequestException("Display name is already taken");
		}

		let avatar = null;
		if (profileDto?.avatar) {
			avatar = this.configService.get<string>('STATIC_URL').concat(decodeURI(profileDto?.avatar));
		} else {
			avatar = userInfo?.avatar;
		}

		const updateUserInfo = await this.usersService.update({
			data: {
				avatar,
				display_name: profileDto?.display_name,
				about: profileDto?.about,
			},
			where: {
				id: userInfo?.id,
			},
		});

		await this.cacheService.setUserInfo(updateUserInfo);
		return updateUserInfo;
	}
}
