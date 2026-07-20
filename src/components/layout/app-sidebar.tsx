"use client";

import { CircleHelp, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavigationPendingIndicator } from "@/components/layout/navigation-pending-indicator";
import type { Messages } from "@/i18n/messages";

type AppSidebarProps = { messages: Messages };

export function AppSidebar({ messages }: AppSidebarProps) {
  const pathname = usePathname();
  const navigation = [
    { href: "/dashboard", label: messages.navigation.dashboard, icon: LayoutDashboard },
    { href: "/projects", label: messages.navigation.projects, icon: FolderKanban },
  ];

  return (
    <aside className="app-sidebar">
      <Link aria-label="SignalBoard dashboard" className="app-wordmark" href="/dashboard" prefetch={true}>
        SignalBoard<span aria-hidden="true">.</span>
      </Link>
      <nav aria-label="Primary navigation" className="sidebar-nav">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
          return (
            <Link aria-current={active ? "page" : undefined} className={active ? "sidebar-link selected" : "sidebar-link"} href={href} key={href} prefetch={true}>
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>{label}</span>
              <NavigationPendingIndicator />
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Secondary navigation" className="sidebar-secondary">
        <button className="sidebar-link" disabled type="button"><Settings aria-hidden="true" size={20} strokeWidth={1.8} /><span>{messages.navigation.settings}</span></button>
        <button className="sidebar-link" disabled type="button"><CircleHelp aria-hidden="true" size={20} strokeWidth={1.8} /><span>{messages.navigation.help}</span></button>
      </nav>
    </aside>
  );
}
