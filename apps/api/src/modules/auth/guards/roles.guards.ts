import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { UserRole } from '@calorielens/shared';
  
  import { ROLES_KEY } from '../decorators/roles.decorator';
  import { CurrentUser } from '../types/current-user.type';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
      const user = request.user;
  
      if (!user) {
        throw new UnauthorizedException();
      }
  
      const hasRole = requiredRoles.includes(user.role);
  
      if (!hasRole) {
        throw new ForbiddenException('Пользователь не аутентифицирован, или у него нет прав');
      }
  
      return true;
    }
}
