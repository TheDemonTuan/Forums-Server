import { FastifyRequest } from "fastify";
import { AuthGuard } from "@/common/guards/auth.guard";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";

@Controller("member")
export class MemberController {
	@UseGuards(AuthGuard)
	@Get("me")
	async me(@Req() req: FastifyRequest) {
		return req?.userInfo;
	}
}
