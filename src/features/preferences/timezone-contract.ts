export function isValidIanaTimezone(timezone: string | undefined): timezone is string {
  if (!timezone) return false;

  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getLocalDateInTimezone(
  timezone: string,
  instant = new Date(),
): string | undefined {
  if (!isValidIanaTimezone(timezone)) return undefined;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}
