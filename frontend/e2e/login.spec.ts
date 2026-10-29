
import { test, expect } from "@playwright/test";

test.describe("TraceIQ login", () => {
  test("renders the login page correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Sign in to TraceIQ" })
    ).toBeVisible();

    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Sign in" })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", "/signup");
  });

  test("validates required login fields", async ({ page }) => {
    await page.goto("/login");

    const email = page.getByLabel("Email address");
    const password = page.getByLabel("Password");

    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");

    await expect(email).toHaveAttribute("type", "email");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Sign in" }).click();

    // The browser should prevent submission because both fields are empty.
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
