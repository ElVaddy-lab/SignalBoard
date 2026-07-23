"use server";

import { cookies } from "next/headers";

import { isValidIanaTimezone } from "@/features/preferences/timezone-contract";

const TIMEZONE_COOKIE = "signalboard-timezone";

export async function getTimezone(): Promise<string> {
  const cookieStore = await cookies();
  const timezone = cookieStore.get(TIMEZONE_COOKIE)?.value;
  return isValidIanaTimezone(timezone) ? timezone : "UTC";
}

export async function setTimezone(timezone: string): Promise<void> {
  if (!isValidIanaTimezone(timezone)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(TIMEZONE_COOKIE, timezone, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
