import { expect, type Page, test } from "@playwright/test";

type TurnstileHarness = {
  callback?: (token: string) => void;
  error?: () => void;
  expired?: () => void;
  renders: number;
};

async function enableRecoverableTestTurnstile(page: Page) {
  await page.addInitScript(() => {
    const harnessWindow = window as Window & { __signalboardTurnstile?: TurnstileHarness };
    harnessWindow.__signalboardTurnstile = { renders: 0 };
    window.turnstile = {
      render: (_container, options) => {
        const renders = (harnessWindow.__signalboardTurnstile?.renders ?? 0) + 1;
        harnessWindow.__signalboardTurnstile = {
          callback: options.callback,
          error: options["error-callback"],
          expired: options["expired-callback"],
          renders,
        };
        return `signalboard-test-widget-${renders}`;
      },
      remove: () => undefined,
      reset: () => undefined,
    };
  });
}

async function waitForTurnstileHarness(page: Page) {
  await page.waitForFunction(() => {
    const harness = (window as Window & { __signalboardTurnstile?: TurnstileHarness }).__signalboardTurnstile;
    return Boolean(harness?.callback && harness.error && harness.expired);
  });
}

test("guest is redirected from the private Dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("English is the default and Ukrainian remains an explicit choice", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/sign-up");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByText("No email confirmation required.")).toBeVisible();

  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitemradio", { name: /Ukrainian/ }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(page.getByRole("heading", { name: "Створіть обліковий запис" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
});

test("auth layouts remain usable on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only layout assertion");
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Turnstile runtime failure is announced and keyboard Retry preserves sign-in credentials", async ({ page }) => {
  await enableRecoverableTestTurnstile(page);
  await page.goto("/sign-in");
  await waitForTurnstileHarness(page);

  const email = page.getByRole("textbox", { name: "Email" });
  const password = page.getByRole("textbox", { name: "Password", exact: true });
  await email.fill("person@example.com");
  await password.fill("SignalBoard!2026");
  const originalTimeOrigin = await page.evaluate(() => performance.timeOrigin);

  await page.evaluate(() => {
    (window as Window & { __signalboardTurnstile?: TurnstileHarness }).__signalboardTurnstile?.error?.();
  });

  await expect(page.getByRole("alert").filter({ hasText: "The security check could not load." })).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry security check" });
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");

  await expect.poll(() => page.evaluate(() =>
    (window as Window & { __signalboardTurnstile?: TurnstileHarness }).__signalboardTurnstile?.renders ?? 0,
  )).toBe(2);
  await expect(page.getByRole("status")).toHaveText("Loading security check\u2026");
  await expect(email).toHaveValue("person@example.com");
  await expect(password).toHaveValue("SignalBoard!2026");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(originalTimeOrigin);

  await page.evaluate(() => {
    (window as Window & { __signalboardTurnstile?: TurnstileHarness }).__signalboardTurnstile?.callback?.("verified-token");
  });
  await expect(page.getByRole("status")).toHaveText("Security check complete.");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
});

test("expired Turnstile challenge is localized and Retry preserves sign-up credentials", async ({ context, page }, testInfo) => {
  const baseURL = String(testInfo.project.use.baseURL);
  await context.addCookies([{ name: "signalboard-locale", value: "uk", url: baseURL }]);
  await enableRecoverableTestTurnstile(page);
  await page.goto("/sign-up");
  await waitForTurnstileHarness(page);

  const email = page.getByRole("textbox", { name: "Електронна пошта" });
  const password = page.getByRole("textbox", { name: "Пароль", exact: true });
  await email.fill("person@example.com");
  await password.fill("SignalBoard!2026");
  await page.evaluate(() => {
    const harness = (window as Window & { __signalboardTurnstile?: TurnstileHarness }).__signalboardTurnstile;
    harness?.callback?.("verified-token");
    harness?.expired?.();
  });

  await expect(page.getByRole("alert").filter({ hasText: "Час перевірки безпеки минув." })).toBeVisible();
  await page.getByRole("button", { name: "Повторити перевірку безпеки" }).click();

  await expect(email).toHaveValue("person@example.com");
  await expect(password).toHaveValue("SignalBoard!2026");
  await expect(page.getByRole("status")).toHaveText("Завантаження перевірки безпеки\u2026");
});

for (const timezone of ["Etc/GMT+12", "Pacific/Kiritimati"]) {
  test.describe(`timezone synchronization in ${timezone}`, () => {
    test.use({ timezoneId: timezone });

    test("refreshes the server once for a fresh cookie and not again when it matches", async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium", "Timezone server-refresh contract runs once on desktop");
      await context.clearCookies();
      const refreshRequests: string[] = [];
      page.on("request", (request) => {
        const headers = request.headers();
        if (headers.rsc !== "1" || headers["next-router-prefetch"]) return;

        void request.headerValue("cookie")
          .then((cookie) => {
            if (cookie?.includes(`signalboard-timezone=${encodeURIComponent(timezone)}`)) {
              refreshRequests.push(request.url());
            }
          })
          .catch(() => undefined);
      });

      await page.goto("/sign-in");
      await expect.poll(() => page.evaluate(() => {
        const raw = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("signalboard-timezone="))
          ?.split("=")[1];
        return raw ? decodeURIComponent(raw) : undefined;
      })).toBe(timezone);
      await expect.poll(() => refreshRequests.length).toBe(1);
      await page.waitForTimeout(500);
      expect(refreshRequests).toHaveLength(1);

      const matchingCookieRefreshes: string[] = [];
      const secondPage = await context.newPage();
      secondPage.on("request", (request) => {
        const headers = request.headers();
        if (headers.rsc === "1" && !headers["next-router-prefetch"]) {
          matchingCookieRefreshes.push(request.url());
        }
      });
      await secondPage.goto("/sign-in");
      await secondPage.waitForTimeout(750);
      expect(matchingCookieRefreshes).toHaveLength(0);
      await secondPage.close();
    });
  });
}
