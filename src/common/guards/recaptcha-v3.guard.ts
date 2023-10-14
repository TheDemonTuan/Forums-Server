import { Injectable, CanActivate, ExecutionContext, BadRequestException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { RecaptchaV3Response } from "../interfaces/recaptcha.interface";
import { AxiosError } from "axios";
import { Request } from "express";

@Injectable()
export class RecaptchaV3Guard implements CanActivate {
	constructor(private readonly httpService: HttpService) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();

		const recaptcha = request?.headers?.["tdt_recaptcha_v3"];

		if (!recaptcha) throw new BadRequestException("Invalid recaptcha");
		
		const { data } = await firstValueFrom(
			this.httpService
				.post<RecaptchaV3Response>(
					"https://www.google.com/recaptcha/api/siteverify",
					{
						secret: process.env.GOOGLE_RECAPTCHA_V3_SECRET_KEY,
						response: recaptcha,
					},
					{
						headers: {
							"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
						},
					}
				)
				.pipe(
					catchError((error: AxiosError) => {						
						throw new BadRequestException("Can't verify recaptcha");
					})
				)
		);

		if (!data?.success || data?.score < 0.5) throw new BadRequestException("Can't verify recaptcha");

		return true;
	}
}
