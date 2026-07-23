import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";

import type { AppLocale } from "@/i18n/config";

export type Messages = typeof en;

const ukMessages: Messages = {
  ...uk,
  auth: {
    ...uk.auth,
    securityVerificationLabel: "Перевірка безпеки",
    securityLoading: "Завантаження перевірки безпеки…",
    securityReady: "Перевірку безпеки завершено.",
    securityError: "Не вдалося завантажити перевірку безпеки. Перевірте з’єднання та спробуйте ще раз.",
    securityExpired: "Час перевірки безпеки минув. Спробуйте ще раз, щоб продовжити.",
    securityRetry: "Повторити перевірку безпеки",
  },
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
