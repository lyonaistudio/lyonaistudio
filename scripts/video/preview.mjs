import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("preview", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.4 });
await page.goto("http://localhost:8977/video.html");
await page.waitForFunction(() => window.__ready === true);
await page.evaluate(() => document.fonts.ready);

const times = [
  0.15, 0.5, 0.85, 1.2, 1.45, 1.9, 2.6, 3.3, 3.9, 4.5, 4.9,
  5.3, 6.5, 8, 9.4, 10.5, 12, 13.5, 14.5, 15.4, 16.5, 17.5, 18.9, 20.2, 21.4,
  22.7, 23.2, 23.6, 24.9, 26.2, 26.7, 27.2, 27.7, 28.9, 30, 30.8, 31.6, 32.2, 33.2, 34.2,
];
for (const t of times) {
  await page.evaluate((tt) => window.__setTime(tt), t);
  const ms = String(Math.round(t * 100)).padStart(5, "0");
  await page.screenshot({ path: `preview/t${ms}.png` });
  console.log("captured", t);
}
await browser.close();
