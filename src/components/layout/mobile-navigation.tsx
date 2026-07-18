"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, FolderKanban, Languages, LayoutDashboard, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { signOutAction } from "@/features/auth/actions";
import { setLocaleCookie } from "@/features/preferences/locale-client";
import { localeLabels, type AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type MobileNavigationProps = { email: string; locale: AppLocale; messages: Messages };

export function MobileNavigation({ email, locale, messages }: MobileNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
  const signOutForm = useRef<HTMLFormElement>(null);
  const items = [
    { href: "/dashboard", label: messages.navigation.dashboard, icon: LayoutDashboard },
    { href: "/projects", label: messages.navigation.projects, icon: FolderKanban },
  ];

  const selectedLocale = pendingLocale ?? locale;

  const chooseLocale = (nextLocale: AppLocale) => {
    if (nextLocale === selectedLocale) return;

    setLocaleCookie(nextLocale);
    setPendingLocale(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <div className="mobile-app-bar">
        <Link aria-label="SignalBoard dashboard" className="mobile-wordmark" href="/dashboard">SignalBoard<span aria-hidden="true">.</span></Link>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button aria-label={messages.navigation.openMenu} className="mobile-menu-button" type="button"><Menu aria-hidden="true" size={22} /></button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="mobile-menu-popover" sideOffset={8}>
              <div className="mobile-menu-summary"><strong>{email.split("@")[0]}</strong><span>{email}</span></div>
              <DropdownMenu.Label className="mobile-menu-label"><Languages aria-hidden="true" size={16} />{messages.common.language}</DropdownMenu.Label>
              <DropdownMenu.RadioGroup
                onValueChange={(value) => chooseLocale(value as AppLocale)}
                value={selectedLocale}
              >
                {(["en", "uk"] as const).map((option) => (
                  <DropdownMenu.RadioItem className="mobile-menu-item" disabled={pending} key={option} value={option}>
                    <span>{option === "en" ? messages.common.english : messages.common.ukrainian}</span>
                    <small>{localeLabels[option]}</small>
                    <DropdownMenu.ItemIndicator><Check aria-hidden="true" size={16} /></DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
              <DropdownMenu.Separator className="mobile-menu-separator" />
              <form action={signOutAction} ref={signOutForm}>
                <DropdownMenu.Item className="mobile-menu-signout" onSelect={(event) => { event.preventDefault(); signOutForm.current?.requestSubmit(); }}>
                  <LogOut aria-hidden="true" size={17} />{messages.navigation.signOut}
                </DropdownMenu.Item>
              </form>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <nav aria-label="Primary navigation" className="mobile-bottom-nav">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
          return (
            <Link aria-current={active ? "page" : undefined} className={active ? "mobile-nav-link selected" : "mobile-nav-link"} href={href} key={href}>
              <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
