/**
 * Tests E2E Playwright — plan de test plateforme (UI smoke).
 * Usage: pnpm --filter @gadz-connect/web test:e2e
 *
 * Prérequis: pnpm dev (web + API), seeds démo.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const API = process.env.API_URL ?? "http://localhost:3001";

const ACCOUNTS = {
  student: { email: "eleve.dupont@ensam.eu", password: "Eleve-Dupont!" },
  teacher: { email: "prof.martin@ensam.eu", password: "Prof-Martin!" },
  rh: { email: "jules.henri@ensam.eu", password: "Pilotage-RH!" },
  suspended: { email: "prof.suspended@ensam.eu", password: "Prof-Suspendu!" },
} as const;

async function devLogin(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto(`${BASE}/?auth=login`);
  await page.getByLabel(/e-mail arts et métiers/i).fill(email);
  const passwordInput = page.getByLabel(/^mot de passe$/i);
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(password);
  }
  await page.getByRole("button", { name: /se connecter|créer/i }).click();
  await page.waitForURL(/\/(app|admin)/, { timeout: 20_000 });
}

test.describe("3. Élève — UI", () => {
  test("E-PUB-01 marketplace publique charge", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).toContainText(/tuteur|prof/i);
  });

  test("E-AUTH-01 login élève → /app", async ({ page }) => {
    await devLogin(page, ACCOUNTS.student.email, ACCOUNTS.student.password);
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator("body")).toContainText(/élève|tableau de bord/i);
  });

  test("E-NAV-01 élève redirigé depuis micro-entreprise", async ({
    page,
  }) => {
    await devLogin(page, ACCOUNTS.student.email, ACCOUNTS.student.password);
    await page.goto(`${BASE}/app/micro-entreprise`);
    await expect(page).toHaveURL(/\/app\/?$/);
  });

  test("E-NAV-02 navigation élève — trouver mon tuteur", async ({ page }) => {
    await devLogin(page, ACCOUNTS.student.email, ACCOUNTS.student.password);
    await page.getByRole("navigation").getByRole("link", { name: /trouver mon tuteur/i }).click();
    await expect(page).toHaveURL(/\/app\/cours/);
  });
});

test.describe("4. Prof — UI", () => {
  test("P-AUTH-02 login prof actif → /app", async ({ page }) => {
    await devLogin(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password);
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator("body")).toContainText(/prof|tableau de bord/i);
  });

  test("P-AUTH-01 prof suspendu bloqué", async ({ page }) => {
    await devLogin(
      page,
      ACCOUNTS.suspended.email,
      ACCOUNTS.suspended.password,
    );
    await expect(page.locator("body")).toContainText(/suspendu/i);
  });

  test("P-NAV-01 navigation prof — mes cours", async ({ page }) => {
    await devLogin(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password);
    await page.getByRole("link", { name: /mes cours/i }).click();
    await expect(page).toHaveURL(/\/app\/cours/);
  });
});

test.describe("5. Admin RH — UI", () => {
  test("A-SEC-04 login RH → /admin", async ({ page }) => {
    await page.goto(`${BASE}/rh/login`);
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(ACCOUNTS.rh.password);
    await page.getByRole("button", { name: /continuer|se connecter/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await expect(page.locator("body")).toContainText(/pilotage|administration/i);
  });

  test("A-NAV-01 navigation admin — utilisateurs", async ({ page }) => {
    await page.goto(`${BASE}/rh/login`);
    await page.locator("#password").fill(ACCOUNTS.rh.password);
    await page.getByRole("button", { name: /continuer|se connecter/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await page.getByRole("link", { name: /utilisateurs/i }).click();
    await expect(page).toHaveURL(/\/admin\/utilisateurs/);
  });
});

test.describe("8. Smoke API", () => {
  test("V-01 health local", async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
  });
});
