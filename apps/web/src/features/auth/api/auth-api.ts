import type { UserRole } from '@calorielens/shared';
import { apiGet, apiPost } from '@/shared/api/client';

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

export function registerUser(payload: RegisterRequest) {
  return apiPost<AuthUser, RegisterRequest>('/auth/register', payload);
}

export const register = registerUser;

export function loginUser(payload: LoginRequest) {
  return apiPost<LoginResponse, LoginRequest>('/auth/login', payload);
}

export const login = loginUser;

export function getMe() {
  return apiGet<AuthUser>('/auth/me', { auth: true });
}
