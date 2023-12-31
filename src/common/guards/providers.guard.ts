import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Provider } from "../enums/provider.enum";
import { PROVIDERS_KEY } from "../decorators/providers.decorator";
import { Request } from "express";

@Injectable()
export class ProvidersGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredProviders = this.reflector.getAllAndOverride<Provider[]>(PROVIDERS_KEY, [context.getHandler(), context.getClass()]);

		if (!requiredProviders) {
			return true;
		}
		const { userInfo } = context.switchToHttp().getRequest<Request>();
		return requiredProviders.some((provider) => userInfo?.oauth === provider);
	}
}
