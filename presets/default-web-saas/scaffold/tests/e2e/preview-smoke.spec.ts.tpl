import { expect, test } from "@playwright/test";

test("preview home loads without browser runtime errors", async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => {
    pageErrors.push(error.message);
  });

  await expect
    .poll(
      async () => {
        try {
          const response = await request.get("/");
          return response.ok();
        } catch {
          return false;
        }
      },
      { timeout: 60_000 }
    )
    .toBe(true);

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).toContainText(/\S/);
  expect(pageErrors).toEqual([]);
});
