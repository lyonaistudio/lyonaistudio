import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const browser = await chromium.launch();

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktopPage.goto("http://localhost:8979/", { waitUntil: "networkidle" });
await desktopPage.waitForTimeout(500);
await scrollThrough(desktopPage);
await desktopPage.screenshot({ path: "maona-desktop-raw.png", fullPage: true });

const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobilePage.goto("http://localhost:8979/", { waitUntil: "networkidle" });
await mobilePage.waitForTimeout(500);
await scrollThrough(mobilePage);
await mobilePage.screenshot({ path: "maona-mobile-raw.png", fullPage: true });

await browser.close();

const desktopBuf = await sharp("maona-desktop-raw.png").resize({ width: 1000 }).jpeg({ quality: 84 }).toBuffer();
const desktopMeta = await sharp(desktopBuf).metadata();

const mobileBuf = await sharp("maona-mobile-raw.png").resize({ width: 480 }).jpeg({ quality: 84 }).toBuffer();
const mobileMeta = await sharp(mobileBuf).metadata();

writeFileSync(
  "site-images.json",
  JSON.stringify({
    desktop: desktopBuf.toString("base64"),
    desktopW: desktopMeta.width,
    desktopH: desktopMeta.height,
    mobile: mobileBuf.toString("base64"),
    mobileW: mobileMeta.width,
    mobileH: mobileMeta.height,
  })
);

console.log("desktop:", desktopMeta.width, "x", desktopMeta.height);
console.log("mobile:", mobileMeta.width, "x", mobileMeta.height);
console.log("site-images.json written");
