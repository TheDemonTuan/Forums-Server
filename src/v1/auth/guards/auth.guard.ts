import {
	CanActivate,
	ExecutionContext,
	HttpException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ConfigService } from "@nestjs/config";
import { UserTokensService } from "@/v1/db/user-tokens/user-tokens.service";
import { UsersService } from "@/v1/db/users/users.service";
import { CacheService } from "@/v1/cache/cache.service";
import { User, UserToken } from "@prisma/client";

declare module "fastify" {
	interface FastifyRequest {
		userInfo: User;
		userToken: UserToken;
	}
}

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
		private readonly userTokensService: UserTokensService,
		private readonly usersService: UsersService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<FastifyRequest>();
		const signTokenCookie =
			request.cookies?.[this.configService.get<string>("USER_TOKEN_COOKIE_NAME")];

		if (!signTokenCookie) {
			throw new HttpException(undefined, 204);
		}

		const unsignTokenCookie = request.unsignCookie(signTokenCookie || "");
		if (!unsignTokenCookie?.valid) {
			throw new UnauthorizedException();
		} else {
			const userTokenId = unsignTokenCookie?.value;
			try {
				let userToken = await this.cacheService.getUserToken(userTokenId);
				if (!userToken) {
					userToken = await this.userTokensService.findFirst({
						where: {
							id: userTokenId,
						},
					});

					if (!userToken) {
						throw new UnauthorizedException();
					}

					await this.cacheService.setUserToken(userToken);
				}

				if (!userToken?.status || userToken?.ip !== request?.ips[0]) {
					await this.cacheService.delUserToken(userTokenId);
					throw new UnauthorizedException();
				}

				let userInfo = await this.cacheService.getUserInfo(userToken?.user_id);
				if (!userInfo) {
					userInfo = await this.usersService.findFirst({
						where: {
							id: userToken?.user_id,
						},
					});

					if (!userInfo) {
						throw new UnauthorizedException();
					}

					await this.cacheService.setUserInfo(userInfo);
				}

				if (!userInfo?.status) {
					await this.cacheService.delUserInfo(userTokenId);
					throw new UnauthorizedException("This account has been disabled");
				}

				request["userInfo"] = userInfo;
				request["userToken"] = userToken;
			} catch (error) {
				if (error?.status === 401) {
					throw error;
				} else {
					throw new InternalServerErrorException("Error verifying user token");
				}
			}
			return true;
		}
	}
}
