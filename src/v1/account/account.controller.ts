import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { PrivatePasswordDto } from "./dto/private-password.dto";
import { AccountService } from "./account.service";
import { AuthGuard } from "@/common/guards/auth.guard";
import { User, UserToken as UserTokenPrisma } from "@prisma/client";
import { UserInfo } from "@/common/decorators/user-info.decorator";
import { Provider } from "@/common/enums/provider.enum";
import { Providers } from "@/common/decorators/providers.decorator";
import { ProvidersGuard } from "@/common/guards/providers.guard";
import { PrivateUserNameDto as PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";
import { ProfileDto } from "./dto/profile.dto";
import { UserToken } from "@/common/decorators/user-token.decorator";
import LocalFilesInterceptor from "@/common/interceptors/locals-file.interceptor";
import { SharpFile, SharpPipe } from "@/common/pipes/sharp.pipe";

@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
@Controller("account")
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@Put("private/password")
	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	async password(@Body() passwordDto: PrivatePasswordDto, @UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma) {
		return await this.accountService.privatePassword(passwordDto, userInfo, userToken?.id);
	}

	@Put("private/username")
	async privateUserName(@Body() privateUserNameDto: PrivateUserNameDto, @UserInfo() userInfo: User) {
		return await this.accountService.privateUserName(privateUserNameDto, userInfo);
	}

	@Put("private/email")
	@Providers(Provider.Default)
	@UseGuards(ProvidersGuard)
	async privateEmail(@Body() privateEmailDto: PrivateEmailDto, @UserInfo() userInfo: User) {
		return await this.accountService.privateEmail(privateEmailDto, userInfo);
	}

	@Put("profile")
	@UseInterceptors(
		LocalFilesInterceptor({
			fieldName: "avatar",
			path: "/members/avatars",
			fileFilter: (request, file, callback) => {
				if (!file.mimetype.includes("image")) {
					return callback(new BadRequestException("Please provide a valid image"), false);
				}
				callback(null, true);
			},
			limits: {
				fileSize: Math.pow(2048, 2), // 4M
			},
		})
	)
	async profile(@Body() profileDto: ProfileDto, @UploadedFile(SharpPipe) file: SharpFile, @UserInfo() userInfo: User) {
		return await this.accountService.profile(profileDto, file, userInfo);
	}

	@Get("sessions")
	async sessions(@UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma) {
		return await this.accountService.sessions(userInfo?.id, userToken?.id);
	}

	@Get("session/:utid")
	async session(@UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma, @Param("utid") utid: string) {
		return await this.accountService.session(userInfo?.id, userToken?.id, utid);
	}

	@Get("session/ip/:ip")
	async sessionIp(@Param("ip") ip: string) {
		return await this.accountService.sessionIp(ip);
	}

	@Delete("session/revoke/:utid")
	async sessionRevoke(@UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma, @Param("utid") utid: string) {
		return await this.accountService.sessionRevoke(userInfo?.id, userToken?.id, utid);
	}

	@Delete("session/revoke/all")
	async sessionRevokeAll(@UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma) {
		return await this.accountService.sessionRevokeAll(userInfo?.id, userToken?.id);
	}

	@Get("security-log")
	async securityLog(@UserInfo() userInfo: User) {
		return await this.accountService.securityLog(userInfo?.id);
	}
}
