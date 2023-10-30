import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../../common/db/user/user.service";
import { PrivatePasswordDto } from "./dto/private-password.dto";
import * as bcrypt from "bcrypt";
import { CacheService } from "../cache/cache.service";
import { $Enums, Prisma, User, UserToken } from "@prisma/client";
import { PrivateUserNameDto } from "./dto/private-username.dto";
import { PrivateEmailDto } from "./dto/private-email.dto";
import { ProfileDto } from "./dto/profile.dto";
import { ConfigService } from "@nestjs/config";
import { UserTokenService } from "../../common/db/user-token/user-token.service";
import { Session } from "./interfaces/sessions.interface";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import { SharpFile } from "@/common/pipes/sharp.pipe";
import { UserSecurityLogService } from "@/common/db/user-security-log/user-security-log.service";
import * as _ from "lodash";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class AccountService {
  constructor(
    private readonly usersService: UserService,
    private readonly userTokensService: UserTokenService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userSecurityLogService: UserSecurityLogService,
    private readonly prismaService: PrismaService
  ) {}

  public async privatePassword(passwordDto: PrivatePasswordDto, userInfo: User, currentUTID: string) {
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

    await Promise.all([this.cacheService.setUserInfo(newUserInfo), this.sessionRevokeAll(userInfo?.id, currentUTID)]);

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
    } else if (
      await this.usersService.findUnique({
        where: { username: privateUserNameDto?.new_username },
      })
    ) {
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
    } else if (
      await this.usersService.findUnique({
        where: { email: privateEmailDto?.new_email },
      })
    ) {
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

  public async profile(profileDto: ProfileDto, file: SharpFile, userInfo: User) {
    if (
      userInfo?.display_name === profileDto?.display_name &&
      userInfo?.about === profileDto?.about &&
      !file?.staticPath
    ) {
      throw new BadRequestException("Nothing to update");
    }

    if (
      (await this.usersService.findUnique({
        where: { display_name: profileDto?.display_name },
      })) &&
      userInfo?.display_name !== profileDto?.display_name
    ) {
      throw new BadRequestException("Display name is already taken");
    }

    const updateUserInfo = await this.usersService.update({
      data: {
        avatar: file?.staticPath ?? userInfo?.avatar,
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

  public async sessions(currentUIID: string, currentUserToken: UserToken) {
    const userTokens = (await this.userTokensService.findMany({
      where: {
        user_id: currentUIID,
      },
      orderBy: {
        created_at: "desc",
      },
    })) as Session[];

    const userTokensCache = await this.cacheService.getUserTokens(currentUIID);

    const userTokenArrOnlineActive: Session[] = [];
    const userTokenArrOnlineInactive: Session[] = [];
    const userTokenArrOfflineActive: Session[] = [];
    const userTokenArrOfflineInactive: Session[] = [];

    userTokens.map((userToken) => {
      userToken.is_active = userTokensCache?.[userToken?.id] ? true : false;
      if (userToken?.id !== currentUserToken?.id) {
        if (userToken?.is_active && userToken?.status) {
          userTokenArrOnlineActive.push(userToken);
        } else if (userToken?.is_active && !userToken?.status) {
          userTokenArrOnlineInactive.push(userToken);
        } else if (!userToken?.is_active && userToken?.status) {
          userTokenArrOfflineActive.push(userToken);
        } else if (!userToken?.is_active && !userToken?.status) {
          userTokenArrOfflineInactive.push(userToken);
        }
      }
    });

    return [
      { ...currentUserToken, is_active: true },
      ...userTokenArrOnlineActive,
      ...userTokenArrOnlineInactive,
      ...userTokenArrOfflineActive,
      ...userTokenArrOfflineInactive,
    ] as Session[];
  }

  public async session(currentUIID: string, currentUTID: string, utid: string) {
    if (!utid) throw new BadRequestException("Invalid session id");

    const userTokenCache = await this.cacheService.getUserToken(currentUIID, utid);
    userTokenCache?.expired && delete userTokenCache?.expired;

    const userTokenDB = await this.userTokensService.findUnique({
      where: {
        id: utid,
        user_id: currentUIID,
      },
    });

    if (!userTokenDB) throw new BadRequestException("Invalid session id");

    return {
      ...userTokenCache,
      ...userTokenDB,
      is_active: userTokenCache ? true : false,
      is_current: userTokenCache?.id === currentUTID,
    };
  }

  public async sessionIp(ip: string) {
    if (!ip) throw new BadRequestException("Invalid ip address");

    const { data } = await firstValueFrom(
      this.httpService
        .get(`http://ip-api.com/json/${ip}?lang=en&fields=66846719`, {
          withCredentials: false,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
          },
        })
        .pipe(
          catchError((err: AxiosError) => {
            throw new BadRequestException("Cannot get ip info");
          })
        )
    );
    return data;
  }

  public async sessionRevoke(currentUIID: string, currentUTID: string, utid: string) {
    if (!utid) throw new BadRequestException("Invalid session id");

    if (currentUTID === utid) throw new BadRequestException("Cannot revoke current session");

    try {
      await this.userTokensService.delete({
        id: utid,
        user_id: currentUIID,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          throw new BadRequestException("Invalid session id");
        } else throw err;
      } else throw err;
    }

    this.cacheService.delUserToken(currentUIID, utid);

    return { message: "Session revoked" };
  }

  public async sessionRevokeSelected(currentUIID: string, currentUTID: string, ids: string[]) {
    if (!_.isArray(ids) || _.isEmpty(ids)) throw new BadRequestException("Invalid session ids");

    if (_.includes(ids, currentUTID))
      throw new BadRequestException("In selected sessions, cannot revoke current session");

    await this.userTokensService.deleteMany({
      id: {
        in: ids,
      },
      user_id: currentUIID,
      NOT: {
        id: currentUTID,
      },
    });

    ids.forEach(async (id) => {
      this.cacheService.delUserToken(currentUIID, id);
    });

    return { message: "Selected sessions revoked" };
  }

  public async sessionRevokeAll(currentUIID: string, currentUTID: string) {
    await this.userTokensService.deleteMany({
      user_id: currentUIID,
      NOT: {
        id: currentUTID,
      },
    });

    await this.cacheService.delUserTokens(currentUIID);

    return { message: "All sessions revoked" };
  }

  public async sessionStatusChange(currentUIID: string, currentUTID: string, utid: string, status: boolean) {
    if (!utid) throw new BadRequestException("Invalid session id");

    if (currentUTID === utid) throw new BadRequestException("Cannot change current session status");

    try {
      const userToken = await this.prismaService.userToken.update({
        where: {
          id: utid,
          user_id: currentUIID,
        },
        data: {
          status,
        },
      });

      const isActive = await this.cacheService.getUserToken(currentUIID, utid);

      if (isActive) await this.cacheService.setUserToken(currentUIID, userToken);

      return {
        ...userToken,
        is_active: isActive ? true : false,
        is_current: false,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new BadRequestException("Invalid session id");
        } else
          throw new InternalServerErrorException("Error while updating session status", {
            cause: error,
          });
      } else
        throw new InternalServerErrorException("Undefined error while updating session status", {
          cause: error,
        });
    }
  }

  public securityLog(currentUIID: string) {
    return this.userSecurityLogService.findMany({
      where: {
        user_id: currentUIID,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }
}
