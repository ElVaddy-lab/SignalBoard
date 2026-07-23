"use client";

import { useEffect, useId, useRef, useState } from "react";

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
  messages: {
    label: string;
    loading: string;
    ready: string;
    error: string;
    expired: string;
    retry: string;
    unavailable: string;
  };
  onToken: (token: string | null) => void;
  resetKey: number;
};

type TurnstileStatus = "loading" | "ready" | "error" | "expired";

const SCRIPT_ID = "signalboard-turnstile";

export function Turnstile({ messages, onToken, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<TurnstileStatus>("loading");
  const instanceId = useId();
  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) {
      onToken(null);
      return;
    }

    let disposed = false;
    setStatus("loading");
    onToken(null);

    const fail = () => {
      if (disposed) return;
      onToken(null);
      setStatus("error");
    };

    const mount = () => {
      if (disposed || !container || !window.turnstile) return;
      container.replaceChildren();
      try {
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: "light",
          callback: (token) => {
            if (disposed) return;
            onToken(token);
            setStatus("ready");
          },
          "error-callback": fail,
          "expired-callback": () => {
            if (disposed) return;
            onToken(null);
            setStatus("expired");
          },
        });
      } catch {
        fail();
      }
    };

    let script: HTMLScriptElement | null = null;
    const handleScriptError = () => {
      script?.remove();
      fail();
    };

    if (window.turnstile) {
      mount();
    } else {
      script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.async = true;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount, { once: true });
      script.addEventListener("error", handleScriptError, { once: true });
    }

    return () => {
      disposed = true;
      script?.removeEventListener("load", mount);
      script?.removeEventListener("error", handleScriptError);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onToken, resetKey, retryKey, siteKey]);

  const retry = () => {
    if (!window.turnstile) {
      document.getElementById(SCRIPT_ID)?.remove();
    }
    setStatus("loading");
    setRetryKey((key) => key + 1);
  };

  if (!siteKey) {
    return <p className="auth-security-error" role="alert">{messages.unavailable}</p>;
  }

  const errorMessage = status === "error" ? messages.error : messages.expired;

  return (
    <div className="turnstile-control">
      <div
        aria-describedby={`${instanceId}-status`}
        aria-label={messages.label}
        className="turnstile-slot"
        ref={containerRef}
        role="group"
      />
      {status === "error" || status === "expired" ? (
        <div className="turnstile-status turnstile-status-error" id={`${instanceId}-status`} role="alert">
          <p>{errorMessage}</p>
          <button className="turnstile-retry" onClick={retry} type="button">{messages.retry}</button>
        </div>
      ) : (
        <p
          className={`turnstile-status ${status === "ready" ? "turnstile-status-ready" : ""}`}
          id={`${instanceId}-status`}
          role="status"
        >
          {status === "ready" ? messages.ready : messages.loading}
        </p>
      )}
    </div>
  );
}
