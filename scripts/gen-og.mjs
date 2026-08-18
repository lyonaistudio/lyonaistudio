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

// Abstract connected-nodes motif, mirrored on both edges. Many chat apps
// (WhatsApp, iMessage...) crop the og:image to a near-square thumbnail
// pulled from the horizontal center, discarding the outer ~30% on each
// side — so every piece of TEXT must live inside that safe zone, and only
// purely decorative graphics belong past it.
const nodesRight = [
  [1000, 140], [1120, 200], [1040, 300], [1160, 340], [1020, 440], [1140, 500],
];
const nodesLeft = nodesRight.map(([x, y]) => [W - x, y]);

function graphSvg(nodes) {
  const pairs = [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5]];
  let links = "";
  for (const [a, b] of pairs) {
    links += `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${ACCENT}" stroke-opacity="0.3" stroke-width="1.5"/>`;
  }
  let dots = "";
  for (const [x, y] of nodes) {
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="${ACCENT}"/>`;
  }
  return links + dots;
}

const cx = W / 2;

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <g>${grid}</g>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade)"/>
  <defs>
    <radialGradient id="fade" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0.2"/>
      <stop offset="75%" stop-color="${INK}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.9"/>
    </radialGradient>
  </defs>
  <g>${graphSvg(nodesRight)}${graphSvg(nodesLeft)}</g>
  <rect x="${cx - 23}" y="150" width="46" height="4" fill="${ACCENT}"/>
  <text x="${cx}" y="210" font-family="DejaVu Sans Mono" font-size="20" letter-spacing="3" fill="${ACCENT}" text-anchor="middle">LYON · FRANCE</text>
  <text x="${cx}" y="320" font-family="Arimo" font-weight="bold" font-size="76" fill="${PAPER}" text-anchor="middle">Lyon AI Studio</text>
  <text x="${cx}" y="380" font-family="Arimo" font-size="30" fill="${MIST}" text-anchor="middle">Sites internet &amp; automatisation IA</text>
  <text x="${cx}" y="422" font-family="Arimo" font-size="30" fill="${MIST}" text-anchor="middle">pour entreprises locales</text>
</svg>
`;

writeFileSync("/tmp/og.svg", svg);

await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(process.argv[2]);
console.log("done");
