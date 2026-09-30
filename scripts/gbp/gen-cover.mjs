import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Google Business Profile "cover photo" — dimensions recommandées 1080x608 (16:9).
const W = 1080;
const H = 608;
const INK = "#121110";
const INK_LINE = "#2b2721";
const PAPER = "#f4f1ea";
const MIST = "#93897a";
const ACCENT = "#e2672c";
const ACCENT_SOFT = "#f0a06f";

mkdirSync("out", { recursive: true });

function grid() {
  let g = "";
  for (let x = 0; x <= W; x += 40) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${INK_LINE}" stroke-width="1" opacity="0.6"/>`;
  for (let y = 0; y <= H; y += 40) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${INK_LINE}" stroke-width="1" opacity="0.6"/>`;
  return g;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nodeMotif(seed, x0, y0, w, h, count) {
  const rand = mulberry32(seed);
  const nodes = Array.from({ length: count }, () => [x0 + rand() * w, y0 + rand() * h]);
  let links = "";
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1) % nodes.length;
    links += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[j][0].toFixed(1)}" y2="${nodes[j][1].toFixed(1)}" stroke="${ACCENT}" stroke-opacity="0.45" stroke-width="1.5"/>`;
    const k = Math.floor(rand() * nodes.length);
    links += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[k][0].toFixed(1)}" y2="${nodes[k][1].toFixed(1)}" stroke="${ACCENT_SOFT}" stroke-opacity="0.22" stroke-width="1.5"/>`;
  }
  const dots = nodes.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 0 ? 6 : 4}" fill="${ACCENT}"/>`).join("");
  return links + dots;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <g>${grid()}</g>

  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${INK}" stop-opacity="1"/>
      <stop offset="52%" stop-color="${INK}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>

  <g>${nodeMotif(11, W * 0.5, H * 0.08, W * 0.48, H * 0.85, 8)}</g>

  <rect x="72" y="${H / 2 - 92}" width="64" height="64" rx="10" fill="${INK}" stroke="${INK_LINE}" stroke-width="2"/>
  <text x="98" y="${H / 2 - 46}" font-family="Space Grotesk" font-weight="700" font-size="34" fill="${ACCENT}">L</text>

  <text x="72" y="${H / 2 + 4}" font-family="Space Grotesk" font-weight="700" font-size="58" fill="${PAPER}">Lyon AI Studio</text>
  <text x="72" y="${H / 2 + 48}" font-family="Inter" font-weight="500" font-size="26" fill="${MIST}">Sites internet &amp; automatisation IA</text>

  <rect x="72" y="${H / 2 + 72}" width="60" height="4" fill="${ACCENT}"/>
  <text x="72" y="${H / 2 + 104}" font-family="JetBrains Mono" font-weight="500" font-size="20" letter-spacing="2" fill="${ACCENT}">LYON, FRANCE</text>
</svg>
`;

await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile("out/google-business-cover.png");
console.log("done: out/google-business-cover.png");
