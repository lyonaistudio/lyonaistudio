import { chromium } from "playwright";

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto("http://localhost:4321/", { waitUntil: "networkidle" });
await desktop.waitForTimeout(400);
await desktop.screenshot({ path: "site-desktop.png", fullPage: true });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:4321/", { waitUntil: "networkidle" });
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: "site-mobile.png", fullPage: true });

await browser.close();
console.log("done");
