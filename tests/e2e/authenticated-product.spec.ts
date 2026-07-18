import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const password = "SignalBoard!2026";

async function enableTestTurnstile(page: Page) {
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        setTimeout(() => options.callback("signalboard-local-test-token"), 200);
        return "signalboard-test-widget";
      },
      remove: () => undefined,
      reset: () => undefined,
    };
  });
}

async function signUp(page: Page, prefix: string) {
  await enableTestTurnstile(page);
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Email" }).fill(`${prefix}-${Date.now()}@example.com`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  const submit = page.getByRole("button", { name: "Create account" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Your Project overview" })).toBeVisible();
}

async function expectNoBlockingAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test("authenticated Project CRUD persists and updates Activity and analytics", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== "chromium", "Desktop product journey");
  const title = `QA launch ${Date.now()}`;

  await signUp(page, "qa-crud");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Project overview" })).toBeVisible();
  await expectNoBlockingAxeViolations(page);

  await page.getByRole("button", { name: "Load Sample Data" }).click();
  await expect(page.getByRole("link", { name: "Release notes" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Projects", exact: true }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText("18 projects", { exact: true })).toBeVisible();
  await expectNoBlockingAxeViolations(page);

  const createTrigger = page.locator("main").getByRole("button", { name: "Create Project" });
  await createTrigger.click();
  const createDialog = page.getByRole("dialog", { name: "Create Project" });
  await expect(createDialog).toBeVisible();
  await expect(createDialog.getByRole("textbox", { name: "Title" })).toBeFocused();
  await createDialog.getByRole("textbox", { name: "Title" }).fill(title);
  await createDialog.getByRole("textbox", { name: "Description" }).fill("Authenticated browser acceptance project.");
  await createDialog.getByRole("textbox", { name: "Project Lead" }).fill("QA Lead");
  await createDialog.getByLabel("Deadline").fill("2020-01-01");
  await createDialog.getByRole("button", { name: "Create Project" }).click();
  await expect(createDialog).toBeHidden();

  const search = page.getByRole("textbox", { name: "Search Projects" });
  await search.fill(title);
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(title).replace(/%20/g, "\\+")}|q=${encodeURIComponent(title)}`));
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue(title);
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Project" });
  await editDialog.getByLabel("Status").selectOption("Completed");
  await editDialog.getByLabel("Priority").selectOption("High");
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editDialog).toBeHidden();
  await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Status changed", { exact: true })).toBeVisible();
  await expectNoBlockingAxeViolations(page);

  await page.getByRole("link", { name: "Dashboard", exact: true }).first().click();
  await expect(page.getByText("Late Completions", { exact: true })).toBeVisible();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

  await page.getByRole("link", { name: title, exact: true }).first().click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const alert = page.getByRole("alertdialog", { name: `Delete ${title}?` });
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Delete Project" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Dashboard", exact: true }).first().click();
  await expect(page.getByText("Project deleted", { exact: true })).toBeVisible();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

  const profile = page.getByRole("button", { name: "Open profile menu" });
  await profile.click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
});

test("authenticated mobile menu exposes locale and sign-out without overflow", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile authenticated journey");
  await signUp(page, "qa-mobile");
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await expectNoBlockingAxeViolations(page);

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("menuitemradio", { name: /Ukrainian/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "uk", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Огляд ваших проєктів" })).toBeVisible();

  await page.getByRole("button", { name: "Відкрити навігацію" }).click();
  await page.getByRole("menuitem", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
});
