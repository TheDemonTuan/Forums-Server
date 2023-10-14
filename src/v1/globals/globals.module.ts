import { Global, Module } from "@nestjs/common";
import { CacheService } from "@/v1/cache/cache.service";
import { UserTokenService } from "../../common/db/user-token/user-token.service";
import { UserService } from "../../common/db/user/user.service";
import { PrismaModule } from "@/common/prisma/prisma.module";
import { PrismaService } from "@/common/prisma/prisma.service";

@Global()
@Module({
  providers: [PrismaService, CacheService, UserService, UserTokenService],
  exports: [PrismaService, CacheService, UserService, UserTokenService],
})
export class GlobalsModule {}
