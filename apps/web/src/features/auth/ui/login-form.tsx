'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { loginUser } from '@/features/auth/api/auth-api';
import { useAuth } from '@/features/auth/lib/use-auth';
import type { LoginFormErrors, LoginFormValues } from '@/features/auth/model/types';
import { validateLoginForm } from '@/features/auth/model/validators';
import styles from '@/features/auth/ui/register-form.module.css';
import { ApiClientError } from '@/shared/api';
import { setAccessToken } from '@/shared/lib';

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Не удалось войти. Попробуйте ещё раз.';
}

export function LoginForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await loginUser(values);
      setAccessToken(response.accessToken);
      await refreshUser();
      router.push('/dashboard');
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Вход в аккаунт</h1>
      <p className={styles.subtitle}>Введите email и пароль, чтобы продолжить.</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => {
              const email = event.target.value;
              setValues((prev) => ({ ...prev, email }));
              setErrors((prev) => ({ ...prev, email: undefined }));
              setServerError(null);
            }}
            disabled={isSubmitting}
          />
          {errors.email ? <p className={styles.error}>{errors.email}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => {
              const password = event.target.value;
              setValues((prev) => ({ ...prev, password }));
              setErrors((prev) => ({ ...prev, password: undefined }));
              setServerError(null);
            }}
            disabled={isSubmitting}
          />
          {errors.password ? <p className={styles.error}>{errors.password}</p> : null}
        </div>

        {serverError ? <p className={styles.serverError}>{serverError}</p> : null}

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>
      </form>

      <p className={styles.footer}>
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </section>
  );
}
