import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserToken as UserTokenPrisma } from "@prisma/client";
import { Request } from "express";

declare module "express" {
	interface Request {
		userToken: UserTokenPrisma;
	}
}

export const UserToken = createParamDecorator((data: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request?.userToken || null;
});
