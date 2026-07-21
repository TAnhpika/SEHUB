import { test, expect } from "@playwright/test";

const apiURL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:5006";

async function isApiHealthy(request) {
  try {
    const response = await request.get(`${apiURL}/health`, { timeout: 5_000 });
    return response.ok();
  } catch {
    return false;
  }
}

test.describe("Login flow (cần API)", () => {
  test("nút Demo Student đăng nhập thẳng vào /home", async ({ page, request }) => {
    test.skip(!(await isApiHealthy(request)), `API không sẵn sàng tại ${apiURL}/health`);

    await page.goto("/login");
    // fillTestAccount() vừa điền vừa gọi login API — không cần bấm "Đăng nhập" thêm.
    await page.getByText("Tài khoản demo (API)").click();
    await page.getByRole("button", { name: /Demo Student/i }).click();

    await expect(page).toHaveURL(/\/home/, { timeout: 30_000 });
  });
});
