"use client";

import { useEffect, useId, useRef } from "react";

import { getTurnstileSiteKey } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback": () => void;
          "expired-callback": () => void;
          theme: "light";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileProps = {
  onToken: (token: string | null) => void;
  resetKey: number;
  unavailableMessage: string;
};

const SCRIPT_ID = "signalboard-turnstile";

export function Turnstile({ onToken, resetKey, unavailableMessage }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const instanceId = useId();
  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) {
      onToken(null);
      return;
    }

    let disposed = false;
    const mount = () => {
      if (disposed || !container || !window.turnstile) return;
      container.replaceChildren();
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount, { once: true });
    }

    return () => {
      disposed = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [instanceId, onToken, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken(null);
    }
  }, [onToken, resetKey]);

  if (!siteKey) {
    return <p className="auth-security-error" role="alert">{unavailableMessage}</p>;
  }

  return <div aria-label="Security verification" className="turnstile-slot" ref={containerRef} role="group" />;
}
