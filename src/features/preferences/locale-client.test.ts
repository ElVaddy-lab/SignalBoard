import { describe, expect, it } from "vitest";

import { LOCALE_COOKIE } from "@/i18n/config";
import { setLocaleCookie } from "@/features/preferences/locale-client";

describe("setLocaleCookie", () => {
  it("persists the selected locale in a browser-readable cookie", () => {
    setLocaleCookie("uk");

    expect(document.cookie).toContain(`${LOCALE_COOKIE}=uk`);
  });
});
