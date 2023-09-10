import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Post,
	Req,
	Res,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { ConfigService } from "@nestjs/config";
import { Ip } from "@/common/decorators/ip.decorator";
import { CacheService } from "../cache/cache.service";
import { OAuthDto } from "./dto/oauth.dto";
import { LoggedInInterceptor } from "./interceptors/logged-in.interceptor";
import { RecaptchaV3Guard } from "@/common/guards/recaptcha-v3.guard";
@Controller("auth")
@UseInterceptors(LoggedInInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService
	) {}

	@UseGuards(RecaptchaV3Guard)
	@Post("login")
	async authLogin(@Body() loginDto: LoginDto, @Ip() ip: string) {
		return await this.authService.login(loginDto, ip);
	}

	@UseGuards(RecaptchaV3Guard)
	@Post("register")
	async authRegister(@Body() registerDto: RegisterDto, @Ip() ip: string) {
		return await this.authService.register(registerDto, ip);
	}

	// @UseGuards(RecaptchaV3Guard)
	@Post("oauth")
	async authOauth(@Ip() ip: string, @Body() body: OAuthDto) {
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
	async authLogout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
		res.clearCookie(this.configService.get<string>("USER_TOKEN_COOKIE_NAME") || "tdt_utid");
		await this.cacheService.delUTAUI(req?.["userInfo"]?.id, req?.["userToken"]?.id);
		return { message: "Logout success" };
	}
}
