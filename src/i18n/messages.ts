import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import type { AppLocale } from "@/i18n/config";

export type Messages = typeof en;

const messages: Record<AppLocale, Messages> = { en, uk };

export function getMessages(locale: AppLocale): Messages {
  return messages[locale];
}
