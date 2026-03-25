import type {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from '@/features/auth/model/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmailAndPassword(
  values: { email: string; password: string },
  passwordTooShortMessage: string,
): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};

  if (!values.email.trim()) {
    errors.email = 'Email обязателен';
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Введите корректный email';
  }

  if (!values.password) {
    errors.password = 'Пароль обязателен';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = passwordTooShortMessage;
  }

  return errors;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  return validateEmailAndPassword(
    values,
    `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
  );
}

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  return validateEmailAndPassword(
    values,
    `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
  );
}
