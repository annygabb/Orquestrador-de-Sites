import { expect, test } from "@playwright/test";

test("landing carrega o visual, tema e console interativo", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Orquestrador de Sites/);
  await expect(page.locator("h1")).toContainText("Pare de recomeçar");
  await expect(page.locator(".product-console")).toBeVisible();
  await expect(page.locator("link[href*='_next/static/css']").first()).toHaveCount(1);
  await page.getByRole("button", { name: /PageSpeed e SEO/ }).click();
  await expect(page.getByText("3 escolhidas")).toBeVisible();
});

test("rotas privadas redirecionam e páginas legais funcionam", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
});

test("headers de segurança são enviados", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("nonce-");
  expect(response.headers()["strict-transport-security"]).toContain("max-age=");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});
