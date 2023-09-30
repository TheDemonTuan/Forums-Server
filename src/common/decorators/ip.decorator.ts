import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const Ip = createParamDecorator((data: string, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.ips.length ? request?.ips[0] : request.ip;
});
