import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import type { AppLocale } from "@/i18n/config";

export type Messages = typeof en;

const ukMessages: Messages = {
  ...uk,
  shell: {
    ...uk.shell,
    removeDemo: "Видалити демо",
    removingDemo: "Видалення демо…",
    demoRemoveFailed: "Не вдалося видалити демо-дані. Спробуйте ще раз.",
  },
  dashboard: {
    ...uk.dashboard,
    statusTooltipHint: "Наведіть курсор або сфокусуйте статус, щоб побачити деталі",
  },
};

const messages: Record<AppLocale, Messages> = { en, uk: ukMessages };

export function getMessages(locale: AppLocale): Messages {
  return messages[locale];
}
