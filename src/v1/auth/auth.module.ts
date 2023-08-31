import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserTokensModule } from "../db/user-tokens/user-tokens.module";
import { UsersModule } from "../db/users/users.module";
import { CacheModule } from "../cache/cache.module";
import { HttpModule } from "@nestjs/axios";

@Module({
	imports: [
		UsersModule,
		UserTokensModule,
		CacheModule,
		HttpModule.register({
			timeout: 10000,
		}),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
