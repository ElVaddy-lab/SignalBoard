import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const password = "SignalBoard!2026";

async function signUp(page: Page) {
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        (
          window as Window & {
            __signalboardTurnstileCallback?: (token: string) => void;
          }
        ).__signalboardTurnstileCallback = options.callback;
        return "signalboard-package-c-widget";
      },
      remove: () => undefined,
      reset: () => undefined,
    };
  });
  await page.goto("/sign-up");
  await page.waitForFunction(() =>
    Boolean(
      (
        window as Window & {
          __signalboardTurnstileCallback?: (token: string) => void;
        }
      ).__signalboardTurnstileCallback,
    ),
  );
  await page.evaluate(() =>
    (
      window as Window & {
        __signalboardTurnstileCallback?: (token: string) => void;
      }
    ).__signalboardTurnstileCallback?.("signalboard-local-test-token"),
  );
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`package-c-${Date.now()}@example.com`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
}

async function expectNoBlockingAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const viewport = window.innerWidth;
    return {
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport,
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter((element) => element.getBoundingClientRect().right > viewport + 1)
        .slice(0, 8)
        .map((element) => ({
          className: element.className,
          right: element.getBoundingClientRect().right,
          tagName: element.tagName,
        })),
    };
  });
  expect(
    Math.max(dimensions.body, dimensions.document),
    JSON.stringify(dimensions.offenders),
  ).toBeLessThanOrEqual(dimensions.viewport);
}

test("Package C Dashboard remains stable and accessible across viewports and locales", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== "chromium", "One cross-viewport acceptance pass");

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`);
  });

  await signUp(page);
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "View Demo" }).click();
  await expect(page.getByRole("img", { name: /18 total Projects/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Planning.*4.*22%/ })).toBeVisible();
  await expect(page.getByRole("table", { name: "Completion trend data" })).toBeAttached();
  await expect(page.getByRole("table", { name: "Status distribution" })).toBeAttached();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoHorizontalOverflow(page);
  await expectNoBlockingAxeViolations(page);
  const initialPanels = await page.locator("main").evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'main [class*="trendPanel"], main [class*="statusPanel"]',
      ),
    ).map((element) => ({
      height: element.getBoundingClientRect().height,
      top: element.getBoundingClientRect().top,
    })),
  );
  await page.waitForTimeout(500);
  const settledPanels = await page.locator("main").evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'main [class*="trendPanel"], main [class*="statusPanel"]',
      ),
    ).map((element) => ({
      height: element.getBoundingClientRect().height,
      top: element.getBoundingClientRect().top,
    })),
  );
  expect(settledPanels).toEqual(initialPanels);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-desktop-en.png"),
  });

  await page.setViewportSize({ width: 768, height: 1024 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-tablet-en.png"),
  });

  await page.context().addCookies([
    {
      name: "signalboard-locale",
      value: "uk",
      url: "http://localhost:3000",
    },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Огляд ваших проєктів" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Огляд статусів" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoBlockingAxeViolations(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("dashboard-mobile-uk-reduced-motion.png"),
  });

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
