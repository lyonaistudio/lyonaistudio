import sharp from "sharp";
import QRCode from "qrcode";
import { mkdirSync } from "node:fs";

export const DPI = 300;
export const mm = (v) => Math.round((v * DPI) / 25.4);

export const COLOR = {
  ink: "#121110",
  inkSoft: "#1a1815",
  inkLine: "#2b2721",
  paper: "#f4f1ea",
  paperDim: "#d9d4c8",
  mist: "#93897a",
  accent: "#e2672c",
  accentSoft: "#f0a06f",
};

export const FONT = {
  display: "Space Grotesk",
  sans: "Inter",
  mono: "JetBrains Mono",
};

export function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function gridMotif(w, h, step, opacity = 1) {
  let g = "";
  for (let x = 0; x <= w; x += step) {
    g += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${COLOR.inkLine}" stroke-width="1.5" opacity="${opacity}"/>`;
  }
  for (let y = 0; y <= h; y += step) {
    g += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${COLOR.inkLine}" stroke-width="1.5" opacity="${opacity}"/>`;
  }
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

export function nodeMotif(seed, x0, y0, w, h, count = 6) {
  const rand = mulberry32(seed);
  const nodes = Array.from({ length: count }, () => [
    x0 + rand() * w,
    y0 + rand() * h,
  ]);
  let links = "";
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1) % nodes.length;
    links += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[j][0].toFixed(1)}" y2="${nodes[j][1].toFixed(1)}" stroke="${COLOR.accent}" stroke-opacity="0.4" stroke-width="2"/>`;
    const k = Math.floor(rand() * nodes.length);
    links += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[k][0].toFixed(1)}" y2="${nodes[k][1].toFixed(1)}" stroke="${COLOR.accentSoft}" stroke-opacity="0.22" stroke-width="2"/>`;
  }
  const dots = nodes
    .map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 0 ? 7 : 5}" fill="${COLOR.accent}"/>`)
    .join("");
  return links + dots;
}

export function logoMark(x, y, size) {
  // Matches public/favicon.svg proportions (128 viewbox, rect+bracket)
  const s = size / 128;
  return `
    <g transform="translate(${x}, ${y}) scale(${s})">
      <rect width="128" height="128" rx="20" fill="${COLOR.ink}" stroke="${COLOR.inkLine}" stroke-width="2"/>
      <path d="M44 30h14v54h30v14H44V30Z" fill="${COLOR.accent}" />
    </g>
  `;
}

export async function qrDataUri(text, options = {}) {
  const buf = await QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: options.dark || COLOR.ink, light: options.light || "#00000000" },
    width: options.width || 600,
  });
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function renderAndCrop({ svg, bleedWmm, bleedHmm, trimWmm, trimHmm, bleedMm, outBleed, outTrim }) {
  mkdirSync("publicité", { recursive: true });
  const bleedWpx = mm(bleedWmm);
  const bleedHpx = mm(bleedHmm);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  if (outBleed) {
    await sharp(png).withMetadata({ density: DPI }).toFile(outBleed);
  }
  if (outTrim) {
    const offset = mm(bleedMm);
    await sharp(png)
      .extract({ left: offset, top: offset, width: mm(trimWmm), height: mm(trimHmm) })
      .withMetadata({ density: DPI })
      .toFile(outTrim);
  }
}
