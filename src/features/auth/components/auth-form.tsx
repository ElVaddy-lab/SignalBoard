"use client";

import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  initialAuthState,
  type AuthActionState,
  type AuthErrorCode,
} from "@/features/auth/action-state";
import { signInAction, signUpAction } from "@/features/auth/actions";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { Turnstile } from "./turnstile";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  locale: AppLocale;
  messages: Messages;
  mode: AuthMode;
};

function getErrorMessage(code: AuthErrorCode | undefined, messages: Messages): string | null {
  if (!code) return null;
  const mapping: Record<AuthErrorCode, string> = {
    captcha: messages.auth.turnstileRequired,
    credentials: messages.auth.invalidCredentials,
    password: messages.auth.passwordMinLength,
    signInFailed: messages.auth.signInFailed,
    signUpFailed: messages.auth.signUpFailed,
    unconfigured: messages.auth.configuredError,
  };
  return mapping[code];
}

export function AuthForm({ locale, messages, mode }: AuthFormProps) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    mode === "sign-in" ? signInAction : signUpAction,
    initialAuthState,
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorSummaryRef = useRef<HTMLParagraphElement>(null);
  const error = getErrorMessage(state.errorCode, messages);
  const isSignIn = mode === "sign-in";
  const emailInvalid = state.errorCode === "credentials" || state.errorCode === "signInFailed";
  const passwordInvalid = emailInvalid || state.errorCode === "password";

  useEffect(() => {
    if (error) errorSummaryRef.current?.focus();
  }, [error, state.attemptId]);

  return (
    <form action={action} className="auth-form" noValidate>
      <div className="field-group">
        <label htmlFor="email">{messages.auth.email}</label>
        <input
          autoComplete="email"
          aria-describedby={emailInvalid ? "auth-error" : undefined}
          aria-invalid={emailInvalid}
          id="email"
          inputMode="email"
          name="email"
          placeholder={messages.auth.emailPlaceholder}
          required
          type="email"
        />
      </div>
      <div className="field-group">
        <label htmlFor="password">{messages.auth.password}</label>
        <div className="password-input-wrap">
          <input
            autoComplete={isSignIn ? "current-password" : "new-password"}
            aria-describedby={[!isSignIn ? "password-hint" : "", passwordInvalid ? "auth-error" : ""].filter(Boolean).join(" ") || undefined}
            aria-invalid={passwordInvalid}
            id="password"
            minLength={8}
            name="password"
            required
            type={passwordVisible ? "text" : "password"}
          />
          <button
            aria-label={passwordVisible ? messages.auth.hidePassword : messages.auth.showPassword}
            className="password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
          </button>
        </div>
        {!isSignIn && <p className="field-hint" id="password-hint">{messages.auth.passwordHint}</p>}
      </div>

      <input name="captchaToken" type="hidden" value={captchaToken ?? ""} />
      <Turnstile onToken={setCaptchaToken} resetKey={state.attemptId} unavailableMessage={messages.auth.securityUnavailable} />
      <p className="turnstile-notice">
        {messages.auth.turnstileNotice} {" "}
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noreferrer" target="_blank">{messages.auth.privacy}</a>
        {" "}{messages.auth.and}{" "}
        <a href="https://www.cloudflare.com/website-terms/" rel="noreferrer" target="_blank">{messages.auth.terms}</a>.
      </p>

      {error && (
        <p className="auth-inline-error" id="auth-error" ref={errorSummaryRef} role="alert" tabIndex={-1}>
          {error}
        </p>
      )}

      <button className="button-primary auth-submit" disabled={pending || !captchaToken} type="submit">
        {pending && <LoaderCircle aria-hidden="true" className="spin" size={18} />}
        {pending ? messages.common.loading : isSignIn ? messages.auth.signIn : messages.auth.signUp}
      </button>

      <p className="auth-switch">
        {isSignIn ? messages.auth.newHere : messages.auth.haveAccount}{" "}
        <Link href={isSignIn ? "/sign-up" : "/sign-in"} hrefLang={locale}>
          {isSignIn ? messages.auth.createAccount : messages.auth.signInInstead}
        </Link>
      </p>
      {!isSignIn && <p className="auth-confirmation-note">{messages.auth.noConfirmation}</p>}
    </form>
  );
}
