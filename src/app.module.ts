import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { V1Module } from "./v1/v1.module";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		CacheModule.register({
			isGlobal: true,
		}),
		V1Module,
	],
})
export class AppModule {}
