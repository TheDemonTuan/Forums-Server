import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
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
import { AuthGuard } from "./guards/auth.guard";
import { Ip } from "@/common/decorators/ip.decorator";
import { CacheService } from "../cache/cache.service";
import { OAuthDto } from "./dto/oauth.dto";
import { LoggedInInterceptor } from "./interceptors/logged.intercaptor";

@Controller("auth")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, stopAtFirstError: true }))
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService
	) {}

	@Post("login")
	@UseInterceptors(LoggedInInterceptor)
	async authLogin(@Body() loginDto: LoginDto, @Ip() ip: string) {
		return await this.authService.login(loginDto, ip);
	}

	@Post("register")
	@UseInterceptors(LoggedInInterceptor)
	async authRegister(@Body() registerDto: RegisterDto, @Ip() ip: string) {
		return await this.authService.register(registerDto, ip);
	}

	@Post("oauth")
	@UseInterceptors(LoggedInInterceptor)
	async authOauth(@Ip() ip: string, @Body() body: OAuthDto) {
		if (!body?.code || !body?.provider) {
			throw new BadRequestException("Invalid body");
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

	@Get("verify")
	@UseGuards(AuthGuard)
	async authVerify(@Req() req: FastifyRequest) {
		const { password, ...userInfo } = req["userInfo"];
		return {
			utid: req["userToken"].id,
			userInfo,
		};
	}

	@Delete("logout")
	async authLogout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
		res.clearCookie(this.configService.get<string>("USER_TOKEN_COOKIE_NAME") || "tdt_utid");
		await this.cacheService.delUTAUI(req?.["userInfo"]?.id, req?.["userToken"]?.id);
		return { message: "Logout success" };
	}
}
