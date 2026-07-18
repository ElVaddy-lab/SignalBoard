"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { setLocaleCookie } from "@/features/preferences/locale-client";
import { localeLabels, type AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type LanguageMenuProps = {
  locale: AppLocale;
  messages: Messages;
  compact?: boolean;
};

export function LanguageMenu({ locale, messages, compact = false }: LanguageMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedLocale = pendingLocale ?? locale;

  useEffect(() => {
    if (!open) return;

    optionRefs.current[selectedLocale === "en" ? 0 : 1]?.focus();
    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, [open, selectedLocale]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.findIndex((option) => option === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const lastIndex = optionRefs.current.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowDown"
          ? (currentIndex + 1) % (lastIndex + 1)
          : (currentIndex - 1 + lastIndex + 1) % (lastIndex + 1);
    optionRefs.current[nextIndex]?.focus();
  };

  const chooseLocale = (nextLocale: AppLocale) => {
    if (nextLocale === selectedLocale) {
      setOpen(false);
      return;
    }

    setLocaleCookie(nextLocale);
    setPendingLocale(nextLocale);
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={messages.common.language}
        className={compact ? "language-trigger language-trigger-compact" : "language-trigger"}
        disabled={pending}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        {compact && <Languages aria-hidden="true" size={17} strokeWidth={1.8} />}
        <span>{localeLabels[selectedLocale]}</span>
        <ChevronDown aria-hidden="true" size={15} strokeWidth={1.8} />
      </button>
      {open && (
        <div aria-label={messages.common.language} className="language-popover" onKeyDown={handleMenuKeyDown} role="menu">
          {(["en", "uk"] as const).map((option, index) => (
            <button
              className="language-option"
              key={option}
              onClick={() => chooseLocale(option)}
              ref={(node) => { optionRefs.current[index] = node; }}
              role="menuitemradio"
              type="button"
              aria-checked={selectedLocale === option}
            >
              <span>{option === "en" ? messages.common.english : messages.common.ukrainian}</span>
              <span className="language-option-code">{localeLabels[option]}</span>
              {selectedLocale === option && <Check aria-label={messages.common.selected} size={16} strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
