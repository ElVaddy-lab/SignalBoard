"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LoaderCircle, LogOut, PlayCircle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { signOutAction } from "@/features/auth/actions";
import { loadSampleProjectsAction } from "@/features/projects/server";
import type { Messages } from "@/i18n/messages";

type UserMenuProps = { email: string; messages: Messages };

export function UserMenu({ email, messages }: UserMenuProps) {
  const label = email.split("@")[0] || "Account";
  const signOutForm = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<"alreadyLoaded" | "error" | null>(null);

  const loadDemo = async (event: Event) => {
    event.preventDefault();
    if (loadingDemo) return;
    setLoadingDemo(true);
    setDemoFeedback(null);
    try {
      const result = await loadSampleProjectsAction();
      if (result.insertedCount === 0) {
        setDemoFeedback("alreadyLoaded");
        return;
      }
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDemoFeedback("error");
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
          <DropdownMenu.Item className="user-menu-demo" disabled={loadingDemo} onSelect={loadDemo}>
            {loadingDemo ? <LoaderCircle aria-hidden="true" className="spin" size={17} /> : <PlayCircle aria-hidden="true" size={17} />}
            {loadingDemo ? messages.shell.loadingDemo : messages.shell.viewDemo}
          </DropdownMenu.Item>
          {demoFeedback ? <p className={demoFeedback === "error" ? "user-menu-feedback user-menu-feedback-error" : "user-menu-feedback"} role={demoFeedback === "error" ? "alert" : "status"}>
            {demoFeedback === "error" ? messages.shell.demoLoadFailed : messages.shell.demoAlreadyLoaded}
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
