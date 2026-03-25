export type RegisterFormValues = {
  email: string;
  password: string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
