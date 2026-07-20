"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LoaderCircle, LogOut, PlayCircle, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { signOutAction } from "@/features/auth/actions";
import { toggleSampleProjectsAction } from "@/features/projects/server";
import type { Messages } from "@/i18n/messages";

type UserMenuProps = { email: string; initialDemoEnabled: boolean; messages: Messages };

export function UserMenu({ email, initialDemoEnabled, messages }: UserMenuProps) {
  const label = email.split("@")[0] || "Account";
  const signOutForm = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(initialDemoEnabled);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<"loadError" | "removeError" | null>(null);

  const toggleDemo = async (event: Event) => {
    event.preventDefault();
    if (loadingDemo) return;
    setLoadingDemo(true);
    setDemoFeedback(null);
    try {
      const result = await toggleSampleProjectsAction();
      setDemoEnabled(result.enabled);
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDemoFeedback(demoEnabled ? "removeError" : "loadError");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setDemoFeedback(null); }}>
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
          <DropdownMenu.Item className="user-menu-demo" disabled={loadingDemo} onSelect={toggleDemo}>
            {loadingDemo ? <LoaderCircle aria-hidden="true" className="spin" size={17} /> : demoEnabled ? <Trash2 aria-hidden="true" size={17} /> : <PlayCircle aria-hidden="true" size={17} />}
            {loadingDemo ? (demoEnabled ? messages.shell.removingDemo : messages.shell.loadingDemo) : (demoEnabled ? messages.shell.removeDemo : messages.shell.viewDemo)}
          </DropdownMenu.Item>
          {demoFeedback ? <p className="user-menu-feedback user-menu-feedback-error" role="alert">
            {demoFeedback === "removeError" ? messages.shell.demoRemoveFailed : messages.shell.demoLoadFailed}
          </p> : null}
          <DropdownMenu.Separator className="mobile-menu-separator" />
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
