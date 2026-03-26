import type { Metadata } from 'next';
import { AuthProvider } from '@/app/providers/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CalorieLens Web',
  description: 'Frontend app for CalorieLens',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
