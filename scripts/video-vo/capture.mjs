import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const FPS = 30;

mkdirSync("frames", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:8978/video.html");
await page.waitForFunction(() => window.__ready === true);
await page.evaluate(() => document.fonts.ready);
const DURATION = await page.evaluate(() => window.__duration);
const TOTAL_FRAMES = Math.round(FPS * DURATION);
console.log("Duration:", DURATION, "Total frames:", TOTAL_FRAMES);

const start = Date.now();
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const t = i / FPS;
  await page.evaluate((tt) => window.__setTime(tt), t);
  const name = `frames/frame_${String(i).padStart(4, "0")}.png`;
  await page.screenshot({ path: name });
  if (i % 60 === 0) console.log(`frame ${i}/${TOTAL_FRAMES} (t=${t.toFixed(2)}s)`);
}
console.log("Captured", TOTAL_FRAMES, "frames in", ((Date.now() - start) / 1000).toFixed(1), "s");

await browser.close();
