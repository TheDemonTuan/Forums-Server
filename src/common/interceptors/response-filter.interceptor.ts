import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { Request } from "express";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseFilterInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService) {}
	intercept(context: ExecutionContext, next: CallHandler) {
		const request = context.switchToHttp().getRequest<Request>();
		return next.handle().pipe(
			map((data: User) => {
				if (data?.avatar)
					data.avatar = new URL(data?.avatar, `${request?.protocol}://${request?.hostname}:${this.configService.get<number>("PORT")}`)?.href;
				if (data?.password) data.password = "";
				return data;
			})
		);
	}
}
