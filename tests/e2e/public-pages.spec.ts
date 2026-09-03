import { expect, test } from "@playwright/test";

test("landing carrega o visual, tema e console interativo", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Orquestrador de Sites/);
  await expect(page.locator("h1")).toContainText("Transforme referências soltas");
  await expect(page.locator(".shader-visual")).toBeVisible();
  await expect(page.getByRole("button", { name: "Interface" })).toBeVisible();
  await expect(page.locator(".process-map")).toBeVisible();
  await expect(page.locator(".process-core")).toContainText("Entrada dispersa");
  await expect(page.locator("body")).not.toContainText("Sem nota fiscal automatizada nesta versão");
  await expect(page.locator(".product-console")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("font-family", /DM Sans/);
  await expect(page.locator(".sales-hero")).toHaveCSS("display", "block");
  const titleSize = await page.locator("h1").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  const consoleStyle = await page.locator(".product-console").evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, radius: Number.parseFloat(style.borderRadius), border: Number.parseFloat(style.borderTopWidth) };
  });
  expect(titleSize).toBeGreaterThan(36);
  expect(consoleStyle.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(consoleStyle.radius).toBeGreaterThan(8);
  expect(consoleStyle.border).toBeGreaterThan(0);
  await page.getByRole("button", { name: /PageSpeed e SEO/ }).click();
  await expect(page.getByText("3 escolhidas")).toBeVisible();
  await page.locator(".estimator-controls input").first().fill("6");
  await expect(page.locator(".time-estimator output")).toContainText("18h");
});

test("rotas privadas redirecionam e páginas legais funcionam", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  await page.goto("/entrar?intent=signup");
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta com Google" })).toBeVisible();
});

test("headers de segurança são enviados", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("nonce-");
  expect(response.headers()["strict-transport-security"]).toContain("max-age=");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});
