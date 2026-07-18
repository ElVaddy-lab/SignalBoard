"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRef } from "react";

import { signOutAction } from "@/features/auth/actions";
import type { Messages } from "@/i18n/messages";

type UserMenuProps = { email: string; messages: Messages };

export function UserMenu({ email, messages }: UserMenuProps) {
  const label = email.split("@")[0] || "Account";
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu.Root>
      <div className="user-menu">
        <DropdownMenu.Trigger asChild>
          <button aria-label={messages.shell.profileMenu} className="user-menu-trigger" type="button">
            <span className="user-avatar" aria-hidden="true"><UserRound size={17} /></span>
            <span className="user-menu-name">{label}</span>
            <ChevronDown aria-hidden="true" size={15} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="user-menu-popover user-menu-radix" sideOffset={8}>
          <div className="user-menu-summary"><strong>{label}</strong><span>{email}</span></div>
          <form action={signOutAction} ref={signOutForm}>
            <DropdownMenu.Item className="user-signout" onSelect={(event) => { event.preventDefault(); signOutForm.current?.requestSubmit(); }}>
              <LogOut aria-hidden="true" size={17} />{messages.navigation.signOut}
            </DropdownMenu.Item>
          </form>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </div>
    </DropdownMenu.Root>
  );
}
