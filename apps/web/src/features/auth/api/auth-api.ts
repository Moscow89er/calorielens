import { apiGet, apiPost } from '@/shared/api/client';
import { UserRole } from '@calorielens/shared';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = RegisterRequest;

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export function register(payload: RegisterRequest) {
  return apiPost<AuthUser, RegisterRequest>('/auth/register', payload);
}

export function login(payload: LoginRequest) {
  return apiPost<LoginResponse, LoginRequest>('/auth/login', payload);
}

export function getMe() {
  return apiGet<AuthUser>('/auth/me', { auth: true });
}
