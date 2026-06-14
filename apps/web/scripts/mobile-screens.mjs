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

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ ...vp, locale: "fr-FR" });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const slug = route.replace(/\W+/g, "_") || "root";
    await page.screenshot({
      path: `screens/${vp.name}__${slug}.png`,
      fullPage: true,
    });
  }
  await ctx.close();
}

await browser.close();
console.log("Screenshots saved to apps/web/screens/");
