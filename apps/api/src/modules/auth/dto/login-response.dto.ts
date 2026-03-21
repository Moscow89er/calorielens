import { UserRole } from "@calorielens/shared";

export class LoginResponseDto {
    accessToken!: string;
    user!: {
        id: string;
        email: string;
        role: UserRole;
    };
}