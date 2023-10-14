import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { HttpModule } from "@nestjs/axios";
import { CustomDBModule } from "../../common/db/custom/custom-db.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
    }),
    CustomDBModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
