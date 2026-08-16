import type { UserRole } from '../constants/roles';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
