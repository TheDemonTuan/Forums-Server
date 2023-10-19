import { PrismaService } from "@/common/prisma/prisma.service";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
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
      const browser =
        uaParser?.getBrowser()?.name === undefined && uaParser?.getBrowser()?.version === undefined
          ? "Unknown"
          : uaParser?.getBrowser()?.name.concat(" ", uaParser?.getBrowser()?.version);
      const engine =
        uaParser?.getEngine()?.name === undefined && uaParser?.getEngine()?.version === undefined
          ? "Unknown"
          : uaParser?.getEngine()?.name?.concat(" ", uaParser?.getEngine()?.version);
      const device =
        uaParser?.getDevice()?.model === undefined && uaParser?.getDevice()?.vendor === undefined
          ? "Unknown"
          : uaParser?.getDevice()?.model.concat(" ", uaParser?.getDevice()?.vendor);
      const device_type =
        uaParser?.getDevice()?.type === undefined ? "Unknown" : uaParser?.getDevice()?.type;
      const os =
        uaParser?.getOS()?.name === undefined && uaParser?.getOS()?.version === undefined
          ? "Unknown"
          : uaParser?.getOS()?.name.concat(" ", uaParser?.getOS()?.version);
      const cpu =
        uaParser?.getCPU()?.architecture === undefined
          ? "Unknown"
          : uaParser?.getCPU()?.architecture;

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
            browser,
            engine,
            device,
            device_type,
            os,
            cpu,
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
