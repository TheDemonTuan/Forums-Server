import { FastifyReply, FastifyRequest } from "fastify";
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LoggedInInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const reply = context.switchToHttp().getResponse<FastifyReply>();

		return next.handle().pipe(
			map((data) => {
				if (data?.utid) {
					reply.cookie(
						this.configService.get<string>("USER_TOKEN_COOKIE_NAME") || "tdt_utid",
						data?.utid,
						{
							httpOnly: true,
							path: "/",
							maxAge: 31536000,
							sameSite: "strict",
							priority: "high",
							domain: "." + this.configService.get<string>("DOMAIN") || "localhost",
							signed: true,
						}
					);
					delete data.utid;
				}
				return data;
			})
		);
	}
}
