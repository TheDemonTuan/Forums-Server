import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@prisma/client";
import { Request } from "express";

declare module "express" {
	interface Request {
		userInfo: User;
	}
}

export const UserInfo = createParamDecorator((data: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request?.userInfo || null;
});
