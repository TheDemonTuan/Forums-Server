import { PrismaService } from "@/prisma/prisma.service";
import { Global, Module } from "@nestjs/common";
import { CacheService } from "@/v1/cache/cache.service";
import { UserTokenService } from "../db/user-token/user-token.service";
import { UserService } from "../db/user/user.service";

@Global()
@Module({
	providers: [PrismaService, CacheService, UserService, UserTokenService],
	exports: [PrismaService, CacheService, UserService, UserTokenService],
})
export class GlobalsModule {}
