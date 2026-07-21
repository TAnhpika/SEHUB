import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("hiển thị hero SEHub và CTA đăng ký", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("cộng đồng SE");
    await expect(page.getByRole("link", { name: /Đăng ký miễn phí/i })).toBeVisible();
  });

  test("đi tới trang đăng nhập từ landing", async ({ page }) => {
    await page.goto("/");

    const loginLink = page.getByRole("link", { name: /Đăng nhập/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: /Chào mừng bạn quay trở lại/i })).toBeVisible();
  });
});
