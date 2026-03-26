'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/lib/use-auth';
import { AuthGuard } from '@/features/auth/ui/auth-guard';

export default function DashboardPage() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AuthGuard>
      <main>
        <h1>Dashboard</h1>
        <p>{`Email: ${user?.email ?? '-'}`}</p>
        <p>{`Role: ${user?.role ?? '-'}`}</p>
        <button type="button" onClick={handleLogout}>
          Выйти
        </button>
      </main>
    </AuthGuard>
  );
}
