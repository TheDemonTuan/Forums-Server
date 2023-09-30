import { Module } from "@nestjs/common";
import { UserTokenService } from "./user-token.service";

@Module({
	providers: [UserTokenService],
	exports: [UserTokenService],
})
export class UserTokenModule {}
