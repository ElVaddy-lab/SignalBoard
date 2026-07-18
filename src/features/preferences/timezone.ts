"use server";

import { cookies } from "next/headers";

const TIMEZONE_COOKIE = "signalboard-timezone";

function isValidTimezone(timezone: string | undefined): timezone is string {
  if (!timezone) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export async function getTimezone(): Promise<string> {
  const cookieStore = await cookies();
  const timezone = cookieStore.get(TIMEZONE_COOKIE)?.value;
  return isValidTimezone(timezone) ? timezone : "UTC";
}

export async function setTimezone(timezone: string): Promise<void> {
  if (!isValidTimezone(timezone)) {
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
