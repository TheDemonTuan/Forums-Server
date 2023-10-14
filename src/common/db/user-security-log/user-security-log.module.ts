import { Global, Module } from "@nestjs/common";
import { UserSecurityLogService } from "./user-security-log.service";

@Module({
	providers: [UserSecurityLogService],
	exports: [UserSecurityLogService],
})
export class UserSecurityLogModule {}
