import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../db/users/users.service";
import { PasswordDto } from "./dto/password.dto";
import * as bcrypt from "bcrypt";
import { CacheService } from "../cache/cache.service";
import { $Enums, User } from "@prisma/client";
import { PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";

@Injectable()
export class AccountService {
	constructor(
		private readonly usersService: UsersService,
		private readonly cacheService: CacheService
	) {}

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

		const newUserInfo = await this.usersService.update({
			data: {
				email: privateEmailDto?.new_email,
			},
			where: {
				id: userInfo?.id,
			},
		});

		await this.cacheService.setUserInfo(newUserInfo);

		return newUserInfo;
	}
}
