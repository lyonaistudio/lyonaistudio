import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (entry.endsWith(".html")) files.push(full);
  }
  return files;
}

function pageExists(href) {
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return true;
  const path = href.split("#")[0].split("?")[0];
  if (path === "/") return existsSync(join(DIST, "index.html"));
  const trimmed = path.replace(/^\//, "").replace(/\/$/, "");
  return existsSync(join(DIST, trimmed, "index.html")) || existsSync(join(DIST, trimmed + ".html")) || existsSync(join(DIST, trimmed));
}

const files = walk(DIST);
let brokenCount = 0;
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  for (const href of new Set(hrefs)) {
    if (!pageExists(href)) {
      console.log(`BROKEN in ${file}: ${href}`);
      brokenCount++;
    }
  }
}
console.log(brokenCount === 0 ? "No broken internal links found." : `${brokenCount} broken link(s) found.`);
