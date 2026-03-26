import { createContext } from 'react';
import type { AuthContextValue } from '@/features/auth/model/auth-state';

export const AuthContext = createContext<AuthContextValue | null>(null);
