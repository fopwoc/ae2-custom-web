import { expect, test } from "@playwright/test";

test("player can browse the terminal workbench", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("DemoPlayer");
  await page.locator('input[name="password"]').fill("demo");
  await page.getByRole("button", { name: "Open terminal" }).click();

  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await expect(page.locator(".item-row")).toHaveCount(3);
  await expectNoHorizontalOverflow(page);

  await page.getByLabel("Filter current view").fill("iron");
  await expect(page.locator(".item-row")).toHaveCount(1);
  await page.getByLabel("Filter current view").fill("");

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
  expect(dimensions.scroll).toBe(dimensions.client);
}
