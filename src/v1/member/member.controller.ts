import { AuthGuard } from "@/common/guards/auth.guard";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserInfo } from "@/common/decorators/user-info.decorator";
import { User } from "@prisma/client";

@Controller("member")
export class MemberController {
	@UseGuards(AuthGuard)
	@Get("me")
	async me(@UserInfo() userInfo: User) {
		return userInfo;
	}
}
