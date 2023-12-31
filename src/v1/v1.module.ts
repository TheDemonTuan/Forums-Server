import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { AccountModule } from "./account/account.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseFilterInterceptor } from "@/common/interceptors/response-filter.interceptor";
import { MemberModule } from "./member/member.module";
import { GlobalsModule } from "./globals/globals.module";

@Module({
	imports: [GlobalsModule, AuthModule, AccountModule, MemberModule],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseFilterInterceptor,
		},
	],
})
export class V1Module { }
