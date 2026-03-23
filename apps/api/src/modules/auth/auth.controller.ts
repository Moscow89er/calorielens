import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from "./types/current-user.type";
import { RolesGuard } from './guards/roles.guards';
import { UserRole } from '@calorielens/shared';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register (@Body() dto: RegisterDto): Promise<AuthUserResponseDto> {
        return this.authService.register(dto);
    }

    @Post('login')
    login (@Body() dto: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login(dto);
    }

    @Get('protected')
    @UseGuards(JwtAuthGuard)
    protected(@CurrentUser() user: CurrentUserType) {
        return {
            message: 'Доступ разрешен',
            user,
        };
    }

    @Get('admin-only')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    adminOnly(@CurrentUser() user: CurrentUserType) {
        return {
            message: 'Доступ администратору разрешен',
            user,
        }
    }
}
