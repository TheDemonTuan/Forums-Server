import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Request } from "express";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

		if (!requiredRoles) {
			return true;
		}
		const { userInfo } = context.switchToHttp().getRequest<Request>();
		return requiredRoles.some((role) => userInfo?.role === role);
	}
}
