import { AuthForm } from "@/features/auth/components/auth-form";
import { LanguageMenu } from "@/components/layout/language-menu";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type AuthScreenProps = {
  locale: AppLocale;
  messages: Messages;
  mode: "sign-in" | "sign-up";
};

export function AuthScreen({ locale, messages, mode }: AuthScreenProps) {
  const signIn = mode === "sign-in";
  const title = signIn ? messages.auth.signInTitle : messages.auth.signUpTitle;
  const description = signIn ? messages.auth.signInDescription : messages.auth.signUpDescription;

  return (
    <main className="auth-page">
      <aside aria-label="SignalBoard" className="auth-art-panel">
        <div className="auth-wordmark">SignalBoard<span aria-hidden="true">.</span></div>
        <div className="auth-art-copy">{messages.auth.artLineOne}<br />{messages.auth.artLineTwo}</div>
        <svg aria-hidden="true" className="auth-art-chart" fill="none" viewBox="0 0 640 360">
          <path d="M0 286H640M0 210H640M0 136H640" stroke="rgba(15, 89, 98, .65)" strokeWidth="2" />
          <path d="M0 286H132L176 232H252L327 178H640" stroke="#C94A2C" strokeWidth="2" />
          <path d="M0 330H80L138 256H224L305 148H640" stroke="#0F5962" strokeWidth="2" />
          <g fill="#C94A2C"><circle cx="132" cy="286" r="5" /><circle cx="176" cy="232" r="5" /><circle cx="252" cy="232" r="5" /><circle cx="327" cy="178" r="5" /></g>
          <g fill="#0F5962"><circle cx="80" cy="330" r="5" /><circle cx="138" cy="256" r="5" /><circle cx="224" cy="256" r="5" /><circle cx="305" cy="148" r="5" /></g>
        </svg>
      </aside>
      <section className="auth-content">
        <div className="auth-language"><LanguageMenu locale={locale} messages={messages} /></div>
        <div className="auth-card">
          <header className="auth-heading">
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          <AuthForm locale={locale} messages={messages} mode={mode} />
        </div>
      </section>
    </main>
  );
}
