import sharp from "sharp";

const W = 1200;
const H = 630;
const INK = "#0a0a0a";
const LINE = "#2b2b2b";
const ACCENT = "#ff003d";
const ACCENT_SOFT = "#ff3860";
const PAPER = "#ffffff";
const PAPER_DIM = "#aaaaaa";
const FONT = "Rethink Sans";

function grid() {
  let g = "";
  for (let x = 0; x <= W; x += 48) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LINE}" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 48) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`;
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

function nodeCluster(seed, x0, y0, w, h, count) {
  const rand = mulberry32(seed);
  const nodes = Array.from({ length: count }, () => [x0 + rand() * w, y0 + rand() * h]);
  let links = "";
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1) % nodes.length;
    links += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[j][0].toFixed(1)}" y2="${nodes[j][1].toFixed(1)}" stroke="${ACCENT}" stroke-opacity="0.45" stroke-width="1.5"/>`;
  }
  const dots = nodes
    .map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 0 ? 5 : 3.5}" fill="${ACCENT}"/>`)
    .join("");
  return links + dots;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <g>${grid()}</g>
  <g>${nodeCluster(7, 20, 90, 220, 320, 6)}</g>
  <g>${nodeCluster(19, 960, 90, 220, 320, 6)}</g>

  <text x="${W / 2}" y="205" font-family="${FONT}" font-weight="700" font-size="17" fill="${ACCENT}" letter-spacing="4" text-anchor="middle">LYON · FRANCE</text>
  <rect x="${W / 2 - 24}" y="222" width="48" height="3" fill="${ACCENT_SOFT}"/>

  <text x="${W / 2}" y="300" font-family="${FONT}" font-weight="700" font-size="64" fill="${PAPER}" text-anchor="middle">Lyon AI Studio</text>

  <text x="${W / 2}" y="352" font-family="${FONT}" font-weight="500" font-size="24" fill="${PAPER_DIM}" text-anchor="middle">Sites internet &amp; automatisation IA</text>
  <text x="${W / 2}" y="384" font-family="${FONT}" font-weight="500" font-size="24" fill="${PAPER_DIM}" text-anchor="middle">partout en France</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og-image.png");
console.log("built public/og-image.png");
