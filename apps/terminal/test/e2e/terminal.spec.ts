import { expect, test } from "@playwright/test";

test("player can browse the terminal workbench", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("DemoPlayer");
  await page.locator('input[name="password"]').fill("demo");
  await page.getByRole("button", { name: "Open terminal" }).click();

  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await expect(page.locator(".item-slot")).toHaveCount(3);
  const ironIcon = page
    .getByRole("button", { name: /Iron Ingot/ })
    .locator("img.item-icon");
  await expect(ironIcon).toBeVisible();
  await expect
    .poll(() =>
      ironIcon.evaluate((image: HTMLImageElement) => image.naturalWidth),
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

  await page.getByLabel("Filter current view").fill("iron");
  await expect(page.locator(".item-slot")).toHaveCount(1);
  await page.getByLabel("Filter current view").fill("");

  await page.getByRole("radio", { name: "All", exact: true }).check();
  await expect(page.locator(".item-slot")).toHaveCount(4);
  await page.getByRole("radio", { name: "Craftable", exact: true }).check();
  await expect(page.locator(".item-slot")).toHaveCount(3);
  await page.getByRole("radio", { name: "Stored", exact: true }).check();

  await page.getByLabel("List").check();
  await expect(page.locator(".item-row")).toHaveCount(3);
  await page.reload();
  await expect(page.getByLabel("List")).toBeChecked();

  await page.getByRole("button", { name: /Crafting CPUs/ }).click();
  await expect(page.getByText("2 processors on this network")).toBeVisible();

  await page.getByRole("button", { name: "Activity" }).click();
  await expect(
    page.getByText("Completed jobs and timing diagnostics"),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
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
