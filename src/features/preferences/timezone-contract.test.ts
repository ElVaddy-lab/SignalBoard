import { describe, expect, it } from "vitest";

import {
  getLocalDateInTimezone,
  isValidIanaTimezone,
} from "./timezone-contract";

describe("timezone contract", () => {
  it.each([
    ["Etc/GMT+12", "2026-07-22"],
    ["UTC", "2026-07-23"],
    ["Pacific/Kiritimati", "2026-07-24"],
  ])("resolves the calendar day in %s", (timezone, expectedDate) => {
    const instant = new Date("2026-07-23T10:30:00.000Z");

    expect(getLocalDateInTimezone(timezone, instant)).toBe(expectedDate);
  });

  it("accepts valid IANA timezones and rejects malformed or encoded values", () => {
    expect(isValidIanaTimezone("Europe/Kyiv")).toBe(true);
    expect(isValidIanaTimezone("Pacific/Kiritimati")).toBe(true);
    expect(isValidIanaTimezone("Europe%2FKyiv")).toBe(false);
    expect(isValidIanaTimezone("Not/A_Timezone")).toBe(false);
    expect(isValidIanaTimezone(undefined)).toBe(false);
  });
});
