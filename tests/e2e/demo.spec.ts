import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const mutationPattern = /\/rest\/v1\/|\/rpc\/|\/auth\/v1\//;

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
}

test("public demo dashboard works without auth or Supabase writes", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (mutationPattern.test(request.url())) externalRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("Read-only demo", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A clear view of every project signal" }),
  ).toBeVisible();
  await expect(page.getByText("18", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Take a quick tour" })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  expect(externalRequests).toEqual([]);
});

test("demo remains available when browser Supabase Auth requests are unavailable", async ({ page }) => {
  await page.route(/\/auth\/v1\//, (route) => route.abort());

  await page.goto("/demo");

  await expect(
    page.getByRole("heading", { name: "A clear view of every project signal" }),
  ).toBeVisible();
});

test("demo project query, reload, detail, and not-found stay read-only", async ({ page }) => {
  await page.goto("/demo/projects?status=Active&priority=High&sort=deadline-asc");
  await expect(page.getByRole("heading", { name: "Demo projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Website Redesign" })).toBeVisible();
  await expect(page.getByRole("button", { name: /create|edit|delete/i })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/status=Active&priority=High&sort=deadline-asc/);
  await page.getByRole("link", { name: "Website Redesign" }).click();
  await expect(page).toHaveURL(/\/demo\/projects\/website-redesign$/);
  await expect(page.getByRole("heading", { name: "Website Redesign" })).toBeVisible();
  await expect(page.getByRole("button", { name: /create|edit|delete/i })).toHaveCount(0);

  await page.goto("/demo/projects/not-a-demo-project");
  await expect(page.getByRole("heading", { name: "Demo project not found" })).toBeVisible();
});

test("guided tour supports keyboard navigation, escape, and focus return", async ({ page }) => {
  await page.goto("/demo");
  const trigger = page.getByRole("button", { name: "Take a quick tour" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Step 2 of 3")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile demo changes locale through the keyboard-accessible language menu without overflow", async ({ page }) => {
  await page.goto("/demo");
  const language = page.getByRole("button", { name: "Language" });

  await expect(language).toBeVisible();
  await language.focus();
  await language.press("Enter");
  await expect(page.getByRole("menu", { name: "Language" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: /Ukrainian/ })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: "Мова" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await expectNoSeriousAxeViolations(page);
});
