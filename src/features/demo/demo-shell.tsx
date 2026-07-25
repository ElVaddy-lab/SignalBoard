import Link from "next/link";
import type { ReactNode } from "react";

import { LanguageMenu } from "@/components/layout/language-menu";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { getDemoCopy } from "./demo-copy";
import styles from "./demo.module.css";
import { DemoTour } from "./demo-tour";

export function DemoShell({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  const copy = getDemoCopy(locale);

  return (
    <div className={styles.demoShell}>
      <a className="skip-link" href="#demo-main">
        {messages.navigation.skipToContent}
      </a>
      <header className={styles.demoHeader}>
        <Link aria-label="SignalBoard" className={styles.wordmark} href="/demo">
          SignalBoard<span aria-hidden="true">.</span>
        </Link>
        <span className={styles.readOnlyBadge}>{copy.badge}</span>
        <nav aria-label={messages.navigation.primaryNavigation}>
          <Link href="/demo">{copy.dashboard}</Link>
          <Link href="/demo/projects">{copy.projects}</Link>
        </nav>
        <div className={styles.headerActions}>
          <DemoTour locale={locale} />
          <Link className={styles.mobileProjectsLink} href="/demo/projects">
            {copy.projects}
          </Link>
          <span className={styles.languageControl}>
            <LanguageMenu compact={false} locale={locale} messages={messages} />
          </span>
          <Link className={styles.signInLink} href="/sign-in">
            {copy.signIn}
          </Link>
        </div>
      </header>
      <main className={styles.demoMain} id="demo-main">
        {children}
      </main>
      <footer className={styles.demoFooter}>
        <div>
          <strong>{copy.portfolioTitle}</strong>
          <p>{copy.portfolioBody}</p>
        </div>
        <div>
          <Link href="/sign-up">{copy.createWorkspace}</Link>
          <Link href="/sign-in">{copy.exit}</Link>
        </div>
      </footer>
    </div>
  );
}
