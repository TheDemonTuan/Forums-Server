import { FastifyRequest } from "fastify";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ApiSecret implements CanActivate {
  constructor(private reflector: Reflector, private readonly configService: ConfigService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const apiToken = request.headers?.["tdt_api_key"];

    if (!apiToken || apiToken !== this.configService.get<string>("TDT_API_KEY")) return false;

    return true;
  }
}
