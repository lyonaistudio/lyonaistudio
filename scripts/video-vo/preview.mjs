import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("preview", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.4 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); else if (m.text().includes("TOTAL_DURATION")) console.log(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:8978/video.html");
await page.waitForFunction(() => window.__ready === true);
await page.evaluate(() => document.fonts.ready);

const times = [0.3, 1.5, 3, 4.5, 6, 8, 10, 13, 15, 17.5, 20, 21.5, 23.5, 26, 28.5, 30.5, 32, 33.5, 35, 37, 38.5, 40, 41, 42.5, 44, 46, 47.5, 49];
for (const t of times) {
  await page.evaluate((tt) => window.__setTime(tt), t);
  const ms = String(Math.round(t * 100)).padStart(5, "0");
  await page.screenshot({ path: `preview/t${ms}.png` });
}
console.log("errors:", JSON.stringify(errors));
await browser.close();
console.log("done");
