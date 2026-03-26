import type { CurrentUser } from '@/entities/user/model/types';
import { apiGet, apiPost } from '@/shared/api/client';

export type AuthUser = CurrentUser;

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

export function getCurrentUser() {
  return apiGet<CurrentUser>('/auth/me', { auth: true });
}

export const getMe = getCurrentUser;
