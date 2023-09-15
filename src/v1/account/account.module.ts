import { Module } from "@nestjs/common";
import { AccountService } from "./account.service";
import { AccountController } from "./account.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
	imports: [
		HttpModule.register({
			timeout: 10000,
		}),
	],
	controllers: [AccountController],
	providers: [AccountService],
})
export class AccountModule {}
