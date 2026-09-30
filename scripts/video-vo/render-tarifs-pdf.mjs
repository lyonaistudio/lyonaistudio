import { chromium } from "playwright";
import path from "node:path";

const src = path.resolve("/home/thomasbatpro/lyon ia studio /commercial/tarifs.html");
const out = path.resolve("/home/thomasbatpro/lyon ia studio /commercial/tarifs-lyon-ai-studio.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${src}`, { waitUntil: "networkidle" });
await page.pdf({
  path: out,
  width: "210mm",
  height: "297mm",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log("PDF written to", out);
