import { expect, test } from "@playwright/test";

test("player can browse the terminal workbench", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("DemoPlayer");
  await page.locator('input[name="password"]').fill("demo");
  await page.getByRole("button", { name: "Open terminal" }).click();

  await expect(page.getByRole("heading", { name: "Terminal" })).toBeVisible();
  await expect(page.locator(".item-slot")).toHaveCount(5);
  const ironIcon = page
    .getByRole("button", { name: /Iron Ingot/ })
    .locator("img.item-icon");
  await expect(ironIcon).toBeVisible();
  await expect
    .poll(() =>
      ironIcon.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const fluidIcon = page
    .getByRole("button", { name: /Ammonium Nitrate Solution/ })
    .locator("img.item-icon");
  await expect(fluidIcon).toBeVisible();
  await expect
    .poll(() =>
      fluidIcon.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const gridColumns = await page
    .locator(".item-grid")
    .evaluate(
      (grid) =>
        getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean)
          .length,
    );
  expect(gridColumns).toBe((page.viewportSize()?.width ?? 0) > 1152 ? 9 : 4);
  await expectNoHorizontalOverflow(page);

  await page.getByLabel("Search items").fill("iron");
  await expect(page.locator(".item-slot")).toHaveCount(1);
  await page.getByLabel("Search items").fill("");

  await page.getByRole("button", { name: "Fluids: shown" }).click();
  await expect(page.locator(".item-slot")).toHaveCount(4);
  await page.getByRole("button", { name: "Fluids: hidden" }).click();
  await expect(page.locator(".item-slot")).toHaveCount(5);

  await page.getByRole("button", { name: /^Show: all/ }).click();
  await expect(page.locator(".item-slot")).toHaveCount(3);
  await page.getByRole("button", { name: /^Show: craftable/ }).click();
  await expect(page.locator(".item-slot")).toHaveCount(4);

  await page.getByRole("button", { name: /^View: grid/ }).click();
  await expect(page.locator(".item-row")).toHaveCount(4);
  await page.reload();
  await expect(page.getByRole("button", { name: /^View: list/ })).toBeVisible();
  await expect(page.locator(".item-row")).toHaveCount(5);

  await page.getByRole("button", { name: /^Crafting/ }).click();
  await expect(
    page.getByRole("heading", { name: "Crafting status" }),
  ).toBeVisible();
  await expect(page.getByText("2 processors", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /CPU · Molecular/ }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("player can enter a compact craft amount", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("DemoPlayer");
  await page.locator('input[name="password"]').fill("demo");
  await page.getByRole("button", { name: "Open terminal" }).click();

  await page.getByRole("button", { name: /Iron Ingot/ }).click();
  await expect(
    page.getByRole("heading", { name: "Select amount" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Amount" }).fill("20k");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("20,000", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start crafting" }),
  ).toBeVisible();
});

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
}
