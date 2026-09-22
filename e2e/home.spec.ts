import { expect, test } from "@playwright/test";

test("home page loads and navigates to reading", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveTitle(/Tarot/i);
  await page.getByRole("button", { name: /tiragem|reading|tirada/i }).first().click();
  await expect(page).toHaveURL(/\/reading/);
});
