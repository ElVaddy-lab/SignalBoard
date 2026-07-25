"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AppLocale } from "@/i18n/config";

import { getDemoCopy } from "./demo-copy";
import styles from "./demo.module.css";

export function DemoTour({ locale }: { locale: AppLocale }) {
  const copy = getDemoCopy(locale);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        className={styles.tourTrigger}
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        {copy.tour}
      </button>
      {open ? (
        <aside
          aria-label={copy.tour}
          className={styles.tourPanel}
          ref={panelRef}
          tabIndex={-1}
        >
          <div className={styles.tourProgress}>{copy.step(step + 1)}</div>
          <button
            aria-label={copy.closeTour}
            className={styles.tourClose}
            onClick={close}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
          <h2>{copy.tourSteps[step].title}</h2>
          <p>{copy.tourSteps[step].body}</p>
          <div className={styles.tourActions}>
            {step > 0 ? (
              <button onClick={() => setStep((value) => value - 1)} type="button">
                <ArrowLeft aria-hidden="true" size={16} />
                {copy.previous}
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={() => {
                if (step === 2) close();
                else setStep((value) => value + 1);
              }}
              type="button"
            >
              {step === 2 ? copy.finish : copy.next}
              {step < 2 ? <ArrowRight aria-hidden="true" size={16} /> : null}
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
