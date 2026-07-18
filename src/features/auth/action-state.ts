export type AuthErrorCode =
  | "captcha"
  | "credentials"
  | "password"
  | "signInFailed"
  | "signUpFailed"
  | "unconfigured";

export type AuthActionState = {
  errorCode?: AuthErrorCode;
  attemptId: number;
};

export const initialAuthState: AuthActionState = { attemptId: 0 };
