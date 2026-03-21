import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { UserRole, JwtPayload } from '@calorielens/shared';
import { UsersService } from '../users/users.service';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { RegisterDto } from './dto/register.dto';
import { mapPrismaRoleToShared } from '../../common/utils/role-mapper';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthUserResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Пользователь с данным email уже существует');
    }

    const saltRounds = this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    const passwordHash = await hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email: normalizedEmail,
      passwordHash,
      role: UserRole.USER,
    });

    return {
      id: user.id,
      email: normalizedEmail,
      role: mapPrismaRoleToShared(user.role),
    };
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Неверный пароль или email');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль или email');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: mapPrismaRoleToShared(user.role),
    }

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: mapPrismaRoleToShared(user.role),
      }
    }
  }
}
