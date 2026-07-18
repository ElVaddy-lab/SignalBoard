import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { height: 1000, width: 1440 },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        setTimeout(() => options.callback("signalboard-local-test-token"), 200);
        return "signalboard-screenshot-widget";
      },
      remove: () => undefined,
      reset: () => undefined,
    };
  });

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Email" }).fill(`portfolio-shot-${Date.now()}@example.com`);
  await page.getByRole("textbox", { exact: true, name: "Password" }).fill("SignalBoard!2026");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Load Sample Data" }).click();
  await page.getByRole("link", { name: "Release notes" }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1_800);
  await page.screenshot({ path: "portfolio-screenshots/dashboard-populated-desktop.png", fullPage: true });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your Project overview" }).waitFor({ state: "visible", timeout: 60_000 });
  await page.getByRole("link", { name: "Release notes" }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: "portfolio-screenshots/dashboard-populated-mobile.png", fullPage: true });

  const dimensions = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewport: innerWidth }));
  console.log(JSON.stringify(dimensions));
} finally {
  await browser.close();
}
