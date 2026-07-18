import { Plus } from "lucide-react";
import Link from "next/link";

import { LanguageMenu } from "@/components/layout/language-menu";
import { UserMenu } from "@/components/layout/user-menu";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type AppHeaderProps = {
  email: string;
  locale: AppLocale;
  messages: Messages;
};

export function AppHeader({ email, locale, messages }: AppHeaderProps) {
  return (
    <header className="app-header">
      <p className="app-header-context">{messages.shell.greeting}</p>
      <div className="app-header-actions">
        <LanguageMenu locale={locale} messages={messages} />
        <UserMenu email={email} messages={messages} />
        <Link className="button-primary header-create-button" href="/projects?new=1"><Plus aria-hidden="true" size={19} />{messages.shell.createProject}</Link>
      </div>
    </header>
  );
}
