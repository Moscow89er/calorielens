import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CurrentUser as CurrentUserType } from '../types/current-user.type';
import { RequestWithUser } from '../types/request-with-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<Partial<RequestWithUser>>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    return request.user;
  },
);
