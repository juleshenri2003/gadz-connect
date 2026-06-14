import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5174";
const ROUTES = (process.env.ROUTES ?? "/,/rh/login").split(",");
const VIEWPORTS = [
  { name: "iphone-se", ...devices["iPhone SE"] },
  { name: "iphone-14", ...devices["iPhone 14"] },
];

mkdirSync("screens", { recursive: true });
const browser = await chromium.launch();

async function devLogin(page) {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const passwordInput = page.locator("#password");
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill("Prof-EnAttente!");
  }
  const continueBtn = page.getByRole("button", { name: "Continuer" });
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
    await page.waitForURL(/\/app/, { timeout: 15000 }).catch(() => {});
  }
}

async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
  const closeGuide = page.getByRole("button", { name: /fermer/i });
  if (await closeGuide.isVisible().catch(() => false)) {
    await closeGuide.click();
  }
}

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ ...vp, locale: "fr-FR" });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    if (route.startsWith("/app")) {
      await devLogin(page);
    }
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await dismissOverlays(page);

    const slug = route.replace(/\W+/g, "_") || "root";
    await page.screenshot({
      path: `screens/${vp.name}__${slug}.png`,
      fullPage: false,
    });

    if (route === "/app" || route === "/admin") {
      const moreBtn = page.getByRole("button", { name: "Plus de navigation" });
      if (await moreBtn.isVisible()) {
        await moreBtn.click({ force: true });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `screens/${vp.name}__${slug}_more.png`,
          fullPage: false,
        });
        await page.keyboard.press("Escape");
      }
    }
  }

  await ctx.close();
}

await browser.close();
console.log("Screenshots saved to apps/web/screens/");
