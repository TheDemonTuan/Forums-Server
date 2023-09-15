import { FastifyRequest } from "fastify";
import { Body, Controller, Put, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { PasswordDto } from "./dto/password.dto";
import { AccountService } from "./account.service";
import { AuthGuard } from "@/common/guards/auth.guard";
import { User } from "@prisma/client";
import { UserInfo } from "@/common/decorators/user-info.decorator";
import { Provider } from "@/common/enums/provider.enum";
import { Providers } from "@/common/decorators/providers.decorator";
import { ProvidersGuard } from "@/common/guards/providers.guard";
import { PrivateUserNameDto as PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";
import { ProfileDto } from "./dto/profile.dto";
import { ApiSecret } from "@/common/guards/api-secret.guard";

@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
@Controller("account")
export class AccountController {
	constructor(private readonly accountService: AccountService) { }

	@Put("password")
	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	async password(@Body() passwordDto: PasswordDto, @UserInfo() userInfo: User) {
		return await this.accountService.password(passwordDto, userInfo);
	}

	@Put("private/username")
	async privateUserName(
		@Body() privateUserNameDto: PrivateUserNameDto,
		@UserInfo() userInfo: User
	) {
		return await this.accountService.privateUserName(privateUserNameDto, userInfo);
	}

	@Put("private/email")
	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	async privateEmail(@Body() privateEmailDto: PrivateEmailDto, @UserInfo() userInfo: User) {
		return await this.accountService.privateEmail(privateEmailDto, userInfo);
	}

	@UseGuards(ApiSecret)
	@Put("public")
	async public(@Body() profileDto: ProfileDto, @UserInfo() userInfo: User) {
		return await this.accountService.public(profileDto, userInfo);
	}
}
