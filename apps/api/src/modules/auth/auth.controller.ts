import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

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
}
