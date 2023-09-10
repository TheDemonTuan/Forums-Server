import { Body, Controller, Put, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
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

@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
@Controller("account")
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	@Put("password")
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

	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	@Put("private/email")
	async privateEmail(@Body() privateEmailDto: PrivateEmailDto, @UserInfo() userInfo: User) {
		return await this.accountService.privateEmail(privateEmailDto, userInfo);
	}
}
