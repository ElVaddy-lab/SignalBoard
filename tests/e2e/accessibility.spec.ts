import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/sign-in", "/sign-up"] as const) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    const blockingViolations = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );

    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });
}

test("auth controls remain keyboard operable", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: "Language" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitemradio", { name: /English/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitemradio", { name: /English/ })).toBeHidden();
  await expect(page.getByRole("button", { name: "Language" })).toBeFocused();

  await page.getByRole("textbox", { name: "Password", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Show password" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveAttribute("type", "text");
});
