import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Turnstile } from "./turnstile";

const messages = {
  label: "Security verification",
  loading: "Loading security check…",
  ready: "Security check complete.",
  error: "The security check could not load. Check your connection and try again.",
  expired: "The security check expired. Try again to continue.",
  retry: "Retry security check",
  unavailable: "Security verification is unavailable in this environment.",
};

describe("Turnstile", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
    document.getElementById("signalboard-turnstile")?.remove();
    delete window.turnstile;
  });

  afterEach(() => {
    cleanup();
    delete window.turnstile;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    document.getElementById("signalboard-turnstile")?.remove();
  });

  it("shows loading and announces a completed security check", () => {
    const onToken = vi.fn();
    let complete: ((token: string) => void) | undefined;
    window.turnstile = {
      render: (_container, options) => {
        complete = options.callback;
        return "test-widget";
      },
      remove: vi.fn(),
      reset: vi.fn(),
    };

    render(<Turnstile messages={messages} onToken={onToken} resetKey={0} />);
    expect(screen.getByRole("status").textContent).toContain(messages.loading);

    act(() => complete?.("verified-token"));

    expect(screen.getByRole("status").textContent).toContain(messages.ready);
    expect(onToken).toHaveBeenLastCalledWith("verified-token");
  });

  it.each([
    ["runtime error", "error-callback", messages.error],
    ["expiry", "expired-callback", messages.expired],
  ] as const)("announces %s and provides an accessible retry", async (_case, callbackName, expectedMessage) => {
    const user = userEvent.setup();
    const onToken = vi.fn();
    const callbacks: Array<() => void> = [];
    const renderWidget = vi.fn((_container: HTMLElement, options: Parameters<NonNullable<Window["turnstile"]>["render"]>[1]) => {
      callbacks.push(options[callbackName]);
      return `test-widget-${callbacks.length}`;
    });
    window.turnstile = {
      render: renderWidget,
      remove: vi.fn(),
      reset: vi.fn(),
    };

    render(<Turnstile messages={messages} onToken={onToken} resetKey={0} />);
    act(() => callbacks[0]());

    expect(screen.getByRole("alert").textContent).toContain(expectedMessage);
    const retry = screen.getByRole("button", { name: messages.retry });
    retry.focus();
    expect(document.activeElement).toBe(retry);

    await user.click(retry);

    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("status").textContent).toContain(messages.loading);
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("turns a failed challenge script into a recoverable alert", () => {
    render(<Turnstile messages={messages} onToken={vi.fn()} resetKey={0} />);

    const script = document.getElementById("signalboard-turnstile");
    expect(script).toBeInstanceOf(HTMLScriptElement);
    fireEvent.error(script as HTMLScriptElement);

    expect(screen.getByRole("alert").textContent).toContain(messages.error);
    expect((screen.getByRole("button", { name: messages.retry }) as HTMLButtonElement).disabled).toBe(false);
  });
});
