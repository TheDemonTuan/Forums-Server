import { Global, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
