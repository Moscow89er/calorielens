import { UserRole } from '@calorielens/shared';

export class AuthUserResponseDto {
    id!: string;
    email!: string;
    role!: UserRole;
}