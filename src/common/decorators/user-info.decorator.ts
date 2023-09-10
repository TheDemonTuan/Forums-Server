import { FastifyRequest } from "fastify";

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const UserInfo = createParamDecorator((data: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<FastifyRequest>();
	return request?.userInfo || null;
});
