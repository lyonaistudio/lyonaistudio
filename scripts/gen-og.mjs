import sharp from "sharp";
import { writeFileSync } from "node:fs";

const W = 1200;
const H = 630;
const INK = "#121110";
const LINE = "#2b2721";
const PAPER = "#f4f1ea";
const MIST = "#93897a";
const ACCENT = "#e2672c";

let grid = "";
for (let x = 0; x <= W; x += 48) {
  grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LINE}" stroke-width="1"/>`;
}
for (let y = 0; y <= H; y += 48) {
  grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`;
}

// abstract connected-nodes motif, right side
const nodes = [
  [960, 140], [1080, 200], [1000, 300], [1120, 340], [980, 440], [1100, 500],
];
let links = "";
const pairs = [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5]];
for (const [a, b] of pairs) {
  links += `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="1.5"/>`;
}
let dots = "";
for (const [x, y] of nodes) {
  dots += `<circle cx="${x}" cy="${y}" r="4" fill="${ACCENT}"/>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <g>${grid}</g>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade)"/>
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${INK}" stop-opacity="1"/>
      <stop offset="55%" stop-color="${INK}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <g>${links}${dots}</g>
  <rect x="96" y="120" width="46" height="4" fill="${ACCENT}"/>
  <text x="96" y="180" font-family="DejaVu Sans Mono" font-size="20" letter-spacing="3" fill="${ACCENT}">LYON · FRANCE</text>
  <text x="94" y="290" font-family="Arimo" font-weight="bold" font-size="76" fill="${PAPER}">Lyon AI Studio</text>
  <text x="96" y="350" font-family="Arimo" font-size="30" fill="${MIST}">Sites internet &amp; automatisation IA</text>
  <text x="96" y="392" font-family="Arimo" font-size="30" fill="${MIST}">pour entreprises locales</text>
</svg>
`;

writeFileSync("/tmp/og.svg", svg);

await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(process.argv[2]);
console.log("done");
