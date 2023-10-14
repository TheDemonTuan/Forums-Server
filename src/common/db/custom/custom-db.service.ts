import { PrismaService } from "@/common/prisma/prisma.service";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { Request } from "express";
import { UAParser } from "ua-parser-js";

@Injectable()
export class CustomDBService {
  constructor(private readonly prismaService: PrismaService) {}

  public async createLoginSession(currentUIID: string, req: Request) {
    try {
      const ip = req?.currentIp;
      const ua = req?.currentUA;

      if (!ip || !ua || !currentUIID) throw new BadRequestException("Invalid request");

      const uaParser = new UAParser(ua);
      const isDesktop =
        uaParser?.getDevice()?.type === undefined ||
        !["wearable", "mobile"].includes(uaParser?.getDevice()?.type);

      return await this.prismaService.$transaction(async (tx) => {
        let userToken = await tx.userToken.findFirst({
          where: { ip, user_id: currentUIID },
          orderBy: { created_at: "desc" },
        });

        if (!userToken) {
          userToken = await tx.userToken.create({
            data: {
              id: randomBytes(27).toString("base64url"),
              ip,
              user: {
                connect: {
                  id: currentUIID,
                },
              },
            },
          });
        }

        await tx.userSecurityLog.create({
          data: {
            ip,
            browser:
              uaParser?.getBrowser()?.name +
              " " +
              uaParser?.getBrowser()?.version,
            engine:
              uaParser?.getEngine()?.name +
              " " +
              uaParser?.getEngine()?.version,
            device:
              uaParser?.getDevice()?.model +
              " " +
              uaParser?.getDevice()?.vendor,
            device_type: isDesktop ? "Desktop" : uaParser?.getDevice()?.type,
            os: uaParser?.getOS()?.name + " " + uaParser?.getOS()?.version,
            cpu: uaParser?.getCPU()?.architecture ?? "Unknown",
            user: {
              connect: {
                id: currentUIID,
              },
            },
          },
        });
        return userToken;
      });
    } catch (error) {
      throw new InternalServerErrorException("Error creating login session", {
        cause: error,
      });
    }
  }
}
