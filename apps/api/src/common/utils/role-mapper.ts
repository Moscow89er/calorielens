import { UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '@calorielens/shared';

export function mapPrismaRoleToShared(role: PrismaUserRole): UserRole {
  switch (role) {
    case PrismaUserRole.USER:
      return UserRole.USER;
    case PrismaUserRole.ADMIN:
      return UserRole.ADMIN;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
