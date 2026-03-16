import type { UserRole } from '../constants/roles';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
