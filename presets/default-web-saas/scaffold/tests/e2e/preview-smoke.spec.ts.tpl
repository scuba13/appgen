import { expect, test } from "@playwright/test";

test("preview home loads without browser runtime errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => {
    pageErrors.push(error.message);
  });

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).toContainText(/\S/);
  expect(pageErrors).toEqual([]);
});
