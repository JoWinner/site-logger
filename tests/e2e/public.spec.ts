import { expect, test } from "@playwright/test";

test("landing page introduces the attendance workflow", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page).toHaveTitle("Site Logger");
  await expect(
    page.getByRole("heading", { name: "Every shift begins with proof." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Open site log/ })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(consoleErrors).toEqual([]);
});

test("login uses username and password without public registration", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(/sign up/i)).toHaveCount(0);
});

test("invalid username returns a generic credential error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("bad@username");
  await page.getByLabel("Password").fill("not-a-real-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "The username or password is incorrect.",
    }),
  ).toBeVisible();
});
