import { test, expect } from "@playwright/test";

test.describe("Login page UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("hiển thị form email, mật khẩu và nút đăng nhập", async ({ page }) => {
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Đăng ký ngay/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Quên mật khẩu/i })).toBeVisible();
  });

  test("báo lỗi khi submit form trống", async ({ page }) => {
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("điền thủ công email và mật khẩu vào form", async ({ page }) => {
    await page.locator("#login-email").fill("demo.student@sehub.local");
    await page.locator("#login-password").fill("Demo@12345");

    await expect(page.locator("#login-email")).toHaveValue("demo.student@sehub.local");
    await expect(page.locator("#login-password")).toHaveValue("Demo@12345");
  });
});
