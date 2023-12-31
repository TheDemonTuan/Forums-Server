import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserTokenService } from "@/common/db/user-token/user-token.service";
import { UserService } from "@/common/db/user/user.service";
import { CacheService } from "@/v1/cache/cache.service";
import { UserTokenCache } from "@/v1/cache/interfaces/user-token-cache.interface";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly userTokensService: UserTokenService,
    private readonly usersService: UserService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const unsignTokenCookie = (await request.signedCookies?.[
      this.configService.get<string>("USER_TOKEN_COOKIE_NAME")
    ]) as string;

    if (!unsignTokenCookie) throw new UnauthorizedException();

    const [userInfoID, userTokenID] = unsignTokenCookie?.split(".");

    if (!userInfoID || !userTokenID) throw new UnauthorizedException();

    let userToken = await this.cacheService.getUserToken(
      userInfoID,
      userTokenID
    );

    if (!userToken) {
      userToken = (await this.userTokensService.findUnique({
        where: {
          id: userTokenID,
          user_id: userInfoID,
        },
      })) as UserTokenCache;

      if (!userToken) {
        throw new UnauthorizedException();
      }

      await this.cacheService.setUserToken(userInfoID, userToken);
    }

    // console.log(userToken);

    const currentIp = request?.ips?.[0] || request?.ip;

    if (!userToken?.status || userToken?.ip !== currentIp)
      throw new UnauthorizedException("This session has been disabled");

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

    if (!userInfo?.status)
      throw new UnauthorizedException("This account has been disabled");

    request["userInfo"] = { ...userInfo };
    request["userToken"] = { ...userToken };

    return true;
  }
}
