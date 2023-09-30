import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";

@Injectable()
export class LoggedInInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const response = context.switchToHttp().getResponse<Response>();
		return next.handle().pipe(
			map((data) => {
				if (data?.utid) {
					response.cookie(this.configService.get<string>("USER_TOKEN_COOKIE_NAME") || "tdt_t", data?.id + "." + data?.utid, {
						httpOnly: true,
						path: "/",
						maxAge: 31536000000,
						expires: new Date(Date.now() + 31536000000),
						sameSite: "strict",
						secure: true,
						domain: "." + this.configService.get<string>("COOKIE_DOMAIN") || "localhost",
						signed: true,
					});
					delete data.utid;
				}
				return data;
			})
		);
	}
}
