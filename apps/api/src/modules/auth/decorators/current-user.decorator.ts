import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { CurrentUser as CurrentUserType } from "../types/current-user.type";

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
        const request = ctx.switchToHttp().getRequest();
        if (!request.user) throw new UnauthorizedException();
        return request.user;
    },
);
