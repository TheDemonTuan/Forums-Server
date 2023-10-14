import { Module } from "@nestjs/common";
import { CustomDBService } from "./custom-db.service";
@Module({
	providers: [CustomDBService],
	exports: [CustomDBService],
})
export class CustomDBModule {}