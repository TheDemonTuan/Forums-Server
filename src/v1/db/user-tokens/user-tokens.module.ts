import {PrismaModule} from "@/prisma/prisma.module";
import {Module} from "@nestjs/common";
import {UserTokensService} from "./user-tokens.service";

@Module({
  imports: [PrismaModule],
  providers: [UserTokensService],
  exports: [UserTokensService],
})
export class UserTokensModule { }