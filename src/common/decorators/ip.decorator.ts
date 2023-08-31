import {FastifyRequest} from 'fastify';

import {createParamDecorator, ExecutionContext} from '@nestjs/common';

export const Ip = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request.ips.length ? request?.ips[0] : request.ip;
  },
);