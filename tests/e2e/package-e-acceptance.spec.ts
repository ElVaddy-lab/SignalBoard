import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const password = "SignalBoard!2026";
const supabaseRequestPattern = /\/(?:auth|rest)\/v1\/|\/rpc\//;
const expectedFields = [
  "project",
  "status",
  "priority",
  "lead",
  "completion",
  "deadline",
  "updated",
];
const expectedCardFields = [
  "project",
  "status",
  "priority",
  "lead",
  "updated",
  "completion",
];

function hasLocalSupabaseConfiguration() {
  const processUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (processUrl) {
    return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/)/.test(processUrl);
  }

  try {
    const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
    return Boolean(url && /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/)/.test(url));
  } catch {
    return false;
  }
}

async function enableTestTurnstile(page: Page) {
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => {
        (
          window as Window & {
            __signalboardTurnstileCallback?: (token: string) => void;
          }
        ).__signalboardTurnstileCallback = options.callback;
        return "signalboard-package-e-widget";
      },
      remove: () => undefined,
      reset: () => undefined,
    };
  });
}

async function signUp(page: Page) {
  await enableTestTurnstile(page);
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
    .fill(`package-e-${Date.now()}@example.com`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "View Demo" }).click();
  await page.getByRole("link", { name: "Projects", exact: true }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
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
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(Math.max(dimensions.body, dimensions.document)).toBeLessThanOrEqual(
    dimensions.viewport,
  );
}

async function tableFields(page: Page) {
  const fields = page
    .getByTestId("projects-table")
    .locator("thead [data-project-field]");
  await expect(fields.first()).toBeAttached();
  return fields.evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("data-project-field"))
        .filter((field) => field !== "actions"),
  );
}

async function cardFields(page: Page) {
  const fields = page
    .locator("[data-project-card]")
    .first()
    .locator("[data-project-field]");
  await expect(fields.first()).toBeAttached();
  return fields.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-project-field")),
  );
}

test("Demo Projects is fixture-only, read-only, queryable, and uses the shared responsive presentation", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "chromium", "One cross-viewport Demo pass");
  const supabaseRequests: string[] = [];
  page.on("request", (request) => {
    if (supabaseRequestPattern.test(request.url())) {
      supabaseRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto("/demo/projects?sort=title-asc");
  await expect(page.getByRole("heading", { name: "Demo projects" })).toBeVisible();
  await expect(page.getByTestId("projects-table")).toBeVisible();
  expect(await tableFields(page)).toEqual(expectedFields);
  await expect(
    page.getByRole("button", { name: /create|edit|delete/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "API Integration", exact: true }).first(),
  ).toBeVisible();

  await page.goto("/demo/projects?status=Completed");
  for (const progressbar of await page.getByRole("progressbar").all()) {
    await expect(progressbar).toHaveAttribute("aria-valuenow", "100");
  }

  await page.goto("/demo/projects?q=Website");
  await expect(
    page.getByRole("link", { name: "Website Redesign", exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator("[data-project-card]")).toHaveCount(1);

  await page.goto("/demo/projects?page=2");
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("link", { name: "SaaS Pricing Update", exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/page=2/);

  const completionByStatus = {
    Planning: 15,
    Active: 55,
    Review: 80,
    Completed: 100,
  } as const;
  for (const [status, completion] of Object.entries(completionByStatus)) {
    await page.goto(`/demo/projects?status=${status}`);
    const progressbar = page.getByRole("progressbar").first();
    await expect(progressbar).toHaveAttribute(
      "aria-valuenow",
      String(completion),
    );
    await expect(progressbar).toHaveAccessibleName(`${completion}% complete`);
    const dimensions = await progressbar.evaluate((track) => {
      const fill = track.firstElementChild?.getBoundingClientRect();
      const trackBox = track.getBoundingClientRect();
      return {
        ratio: fill ? fill.width / trackBox.width : 0,
        trackWidth: trackBox.width,
      };
    });
    expect(dimensions.trackWidth).toBeGreaterThanOrEqual(76);
    expect(dimensions.ratio).toBeCloseTo(completion / 100, 1);
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/demo/projects");
  await expect(page.getByTestId("projects-table")).toBeHidden();
  await expect(page.getByTestId("projects-cards")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const search = page.getByRole("searchbox", { name: "Search Projects" });
  await search.focus();
  await search.press("Tab");
  await expect(page.getByRole("combobox", { name: "Status" })).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/projects");
  await expect(page.getByTestId("projects-table")).toBeHidden();
  await expect(page.getByTestId("projects-cards")).toBeVisible();
  expect(await cardFields(page)).toEqual(expectedCardFields);
  await expectNoHorizontalOverflow(page);
  await expectNoBlockingAxeViolations(page);

  await page.context().addCookies([
    {
      name: "signalboard-locale",
      value: "uk",
      url: new URL(page.url()).origin,
    },
  ]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expectNoHorizontalOverflow(page);
  await expectNoBlockingAxeViolations(page);
  expect(supabaseRequests).toEqual([]);
});

test("Private Projects progress and shared Private/Demo structures stay aligned", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== "chromium", "One cross-viewport private pass");
  test.skip(
    !hasLocalSupabaseConfiguration(),
    "Authenticated Package E acceptance requires local Supabase; hosted data is out of scope.",
  );

  await signUp(page);
  const privateTableFields = await tableFields(page);
  expect(privateTableFields).toEqual(expectedFields);

  const completionByStatus = {
    Planning: 15,
    Active: 55,
    Review: 80,
    Completed: 100,
  } as const;
  const trackWidths: number[] = [];
  let activeDetailHref: string | null = null;
  for (const [status, completion] of Object.entries(completionByStatus)) {
    await page.goto(`/projects?status=${status}`);
    const row = page.locator(`tr[data-project-status="${status}"]`).first();
    const progressbar = row.getByRole("progressbar");
    await expect(progressbar).toHaveAttribute(
      "aria-valuenow",
      String(completion),
    );
    const dimensions = await progressbar.evaluate((track) => {
      const fill = track.firstElementChild?.getBoundingClientRect();
      const trackBox = track.getBoundingClientRect();
      return {
        ratio: fill ? fill.width / trackBox.width : 0,
        trackWidth: trackBox.width,
      };
    });
    trackWidths.push(dimensions.trackWidth);
    expect(dimensions.trackWidth).toBeGreaterThanOrEqual(76);
    expect(dimensions.ratio).toBeCloseTo(completion / 100, 1);
    if (status === "Active") {
      activeDetailHref = await row.getByRole("link").first().getAttribute("href");
    }
  }
  expect(Math.max(...trackWidths) - Math.min(...trackWidths)).toBeLessThanOrEqual(
    1,
  );

  await page.goto("/demo/projects");
  expect(await tableFields(page)).toEqual(privateTableFields);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects");
  const privateCardFields = await cardFields(page);
  expect(privateCardFields).toEqual(expectedCardFields);
  await expect(page.getByTestId("projects-cards").getByRole("progressbar").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/demo/projects");
  expect(await cardFields(page)).toEqual(privateCardFields);
  await expect(
    page.getByRole("button", { name: /create|edit|delete/i }),
  ).toHaveCount(0);

  expect(activeDetailHref).toBeTruthy();
  await page.goto(activeDetailHref!);
  const detailProgress = page.getByRole("progressbar");
  await expect(detailProgress).toHaveAttribute("aria-valuenow", "55");
  expect((await detailProgress.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
});
