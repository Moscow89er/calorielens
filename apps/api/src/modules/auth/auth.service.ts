import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, UserRole } from '@calorielens/shared';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { mapPrismaRoleToShared } from '../../common/utils/role-mapper';
import { UsersService } from '../users/users.service';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUserResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Пользователь с данным email уже существует');
    }

    const saltRounds = this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    const passwordHash = await hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email,
      passwordHash,
      role: UserRole.USER,
    });

    const role = mapPrismaRoleToShared(user.role);

    return {
      id: user.id,
      email: user.email,
      role,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Неверный пароль или email');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль или email');
    }

    const role = mapPrismaRoleToShared(user.role);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
