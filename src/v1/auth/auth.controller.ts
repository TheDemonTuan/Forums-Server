import { BadRequestException, Body, Controller, Delete, Post, Res, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "../cache/cache.service";
import { OAuthDto } from "./dto/oauth.dto";
import { LoggedInInterceptor } from "./interceptors/logged-in.interceptor";
import { RecaptchaV3Guard } from "@/common/guards/recaptcha-v3.guard";
import { RequestInfoInterceptor } from "@/common/interceptors/req-info.interceptor";
import { AuthGuard } from "@/common/guards/auth.guard";
import { UserInfo } from "@/common/decorators/user-info.decorator";
import { User, UserToken as UserTokenPrisma } from "@prisma/client";
import { Ip } from "@/common/decorators/ip.decorator";
import { UserToken } from "@/common/decorators/user-token.decorator";
import { Response } from "express";

@Controller("auth")
@UseInterceptors(LoggedInInterceptor)
@UseInterceptors(RequestInfoInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService
	) {}

	// @UseGuards(RecaptchaV3Guard)
	@Post("login")
	async authLogin(@Body() loginDto: LoginDto, @Ip() ip: string) {
		return await this.authService.login(loginDto, ip);
	}

	@UseGuards(RecaptchaV3Guard)
	@Post("register")
	async authRegister(@Body() registerDto: RegisterDto, @Ip() ip: string) {
		return await this.authService.register(registerDto, ip);
	}

	@UseGuards(RecaptchaV3Guard)
	@Post("oauth")
	async authOauth(@Body() body: OAuthDto, @Ip() ip: string) {
		if (!body?.code || !body?.provider) {
			throw new BadRequestException("Invalid code or provider");
		}
		switch (body?.provider) {
			case "google":
				return await this.authService.googleOAuth(body?.code, ip);
			case "github":
				return await this.authService.githubOAuth(body?.code, ip);
			default:
				throw new BadRequestException("Invalid provider");
		}
	}

	@Delete("logout")
	@UseGuards(AuthGuard)
	async authLogout(@Res({ passthrough: true }) res: Response, @UserInfo() userInfo: User, @UserToken() userToken: UserTokenPrisma) {
		res.clearCookie(this.configService.get<string>("USER_TOKEN_COOKIE_NAME") || "tdt_t");
		await this.cacheService.delUTAUI(userInfo?.id, userToken?.id);
		return { message: "Logout success" };
	}
}
