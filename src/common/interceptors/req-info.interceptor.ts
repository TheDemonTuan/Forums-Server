import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Request } from "express";
import { tap } from "rxjs/operators";

declare module "express" {
  interface Request {
    currentIp: string;
    currentUA: string;
  }
}

@Injectable()
export class RequestInfoInterceptor implements NestInterceptor {
  constructor() {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    request.currentIp = request?.ips.length ? request?.ips[0] : request?.ip;
    request.currentUA = request?.headers["user-agent"] || "";
    return next.handle().pipe(tap());
  }
}
