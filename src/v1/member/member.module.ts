import { Module } from "@nestjs/common";
import { MemberService } from "./member.service";
import { MemberController } from "./member.controller";

@Module({
	imports: [],
	controllers: [MemberController],
	providers: [MemberService],
})
export class MemberModule {}
