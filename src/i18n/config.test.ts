import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, isAppLocale, localeLabels } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

describe("locale contract", () => {
  it("keeps English as the default portfolio interface", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("uses standards-compliant locale values with EN and UA display labels", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("uk")).toBe(true);
    expect(isAppLocale("ua")).toBe(false);
    expect(localeLabels).toEqual({ en: "EN", uk: "UA" });
  });

  it("keeps Ukrainian messages structurally aligned with the English default", () => {
    expect(leafPaths(getMessages("uk")).sort()).toEqual(leafPaths(getMessages("en")).sort());
  });

  it("decodes Unicode message content correctly", () => {
    expect(getMessages("en").dashboard.intro).toBe("Here\u2019s what\u2019s happening with your Projects.");
    expect(getMessages("uk").dashboard.intro).toBe("\u041e\u0441\u044c \u0449\u043e \u0432\u0456\u0434\u0431\u0443\u0432\u0430\u0454\u0442\u044c\u0441\u044f \u0437 \u0432\u0430\u0448\u0438\u043c\u0438 \u043f\u0440\u043e\u0454\u043a\u0442\u0430\u043c\u0438.");
  });
});
