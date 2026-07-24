import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type AppShellProps = {
  children: ReactNode;
  email: string;
  initialDemoEnabled: boolean;
  locale: AppLocale;
  messages: Messages;
};

export function AppShell({ children, email, initialDemoEnabled, locale, messages }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{messages.navigation.skipToContent}</a>
      <AppSidebar messages={messages} />
      <div className="app-main-frame">
        <AppHeader email={email} initialDemoEnabled={initialDemoEnabled} locale={locale} messages={messages} />
        <MobileNavigation email={email} locale={locale} messages={messages} />
        <main className="app-content" id="main-content">{children}</main>
      </div>
    </div>
  );
}
