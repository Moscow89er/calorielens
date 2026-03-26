'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { registerUser } from '@/features/auth/api/auth-api';
import { useAuth } from '@/features/auth/lib/use-auth';
import type { RegisterFormErrors, RegisterFormValues } from '@/features/auth/model/types';
import { validateRegisterForm } from '@/features/auth/model/validators';
import styles from '@/features/auth/ui/register-form.module.css';
import { ApiClientError } from '@/shared/api';

const INITIAL_VALUES: RegisterFormValues = {
  email: '',
  password: '',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return 'Не удалось зарегистрироваться. Попробуйте ещё раз.';
}

export function RegisterForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      await registerUser(values);
      router.push('/login');
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Создать аккаунт</h1>
      <p className={styles.subtitle}>Введите email и пароль, чтобы начать работу.</p>

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
            autoComplete="new-password"
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
          {isSubmitting ? 'Регистрируем...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className={styles.footer}>
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </section>
  );
}
