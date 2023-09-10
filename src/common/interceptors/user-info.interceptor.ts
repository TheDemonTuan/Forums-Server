import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { User } from "@prisma/client";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class UserInfoInterceptor implements NestInterceptor {
	constructor() {}
	intercept(context: ExecutionContext, next: CallHandler) {
		return next.handle().pipe(
			map((data: User) => {
				if (data?.password) {
					delete data.password;
				}
				return data;
			})
		);
	}
}
