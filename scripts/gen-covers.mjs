import sharp from "sharp";
import { mkdirSync } from "node:fs";

const W = 1200;
const H = 675;
const INK = "#121110";
const LINE = "#2b2721";
const ACCENT = "#e2672c";
const ACCENT_SOFT = "#f0a06f";

mkdirSync("public/images/blog", { recursive: true });

function grid() {
  let g = "";
  for (let x = 0; x <= W; x += 48) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LINE}" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 48) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`;
  return g;
}

function nodeCluster(seed) {
  const rand = mulberry32(seed);
  const count = 7;
  const nodes = Array.from({ length: count }, () => [
    200 + rand() * 800,
    120 + rand() * 430,
  ]);
  let links = "";
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1) % nodes.length;
    const k = Math.floor(rand() * nodes.length);
    links += `<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[j][0]}" y2="${nodes[j][1]}" stroke="${ACCENT}" stroke-opacity="0.3" stroke-width="1.5"/>`;
    links += `<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[k][0]}" y2="${nodes[k][1]}" stroke="${ACCENT_SOFT}" stroke-opacity="0.18" stroke-width="1.5"/>`;
  }
  let dots = nodes
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 6 : 4}" fill="${ACCENT}"/>`)
    .join("");
  return links + dots;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function build(seed, filename) {
  const svg = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${INK}"/>
    <g>${grid()}</g>
    <g>${nodeCluster(seed)}</g>
    <rect x="0" y="0" width="${W}" height="6" fill="${ACCENT}"/>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(`public/images/blog/${filename}`);
  console.log("built", filename);
}

await build(11, "cover-artisan.webp");
await build(42, "cover-agent-ia.webp");
await build(77, "cover-site-web.webp");
