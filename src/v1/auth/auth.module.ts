import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { HttpModule } from "@nestjs/axios";

@Module({
	imports: [
		HttpModule.register({
			timeout: 10000,
		}),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
