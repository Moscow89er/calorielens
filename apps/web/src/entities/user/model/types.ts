import type { UserRole } from '@calorielens/shared';

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
};
