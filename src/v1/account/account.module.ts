import { Module } from "@nestjs/common";
import { AccountService } from "./account.service";
import { AccountController } from "./account.controller";
import { HttpModule } from "@nestjs/axios";
import { UserSecurityLogModule } from "@/common/db/user-security-log/user-security-log.module";

@Module({
	imports: [
		HttpModule.register({
			timeout: 10000,
		}),
		UserSecurityLogModule,
	],
	controllers: [AccountController],
	providers: [AccountService],
})
export class AccountModule {}
