import { mm, COLOR, FONT, esc, nodeMotif, logoMark, radialGlow, qrDataUri, renderAndCrop } from "./lib.mjs";
import { SITE } from "./site-data.mjs";

const TRIM_W = 85, TRIM_H = 55, BLEED = 3;
const BW = TRIM_W + BLEED * 2, BH = TRIM_H + BLEED * 2;
const bw = mm(BW), bh = mm(BH);
const margin = mm(BLEED + 5); // safe margin from trim edge

function frontSvg() {
  const glow = radialGlow("frontGlow", mm(20), mm(18), mm(34), COLOR.accent, 0.3);
  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}
    <g>${nodeMotif(5, bw - mm(38), bh - mm(30), mm(30), mm(22), 5)}</g>
    ${logoMark(margin, margin, mm(9))}
    <text x="${margin + mm(11.5)}" y="${margin + mm(6.6)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(6.4)}" fill="${COLOR.paper}">${esc("Lyon AI Studio")}</text>
    <text x="${margin}" y="${bh - margin}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.3)}" fill="${COLOR.mist}">${esc("Sites internet & automatisation IA")}</text>
    <rect x="${margin}" y="${bh - margin - mm(6)}" width="${mm(10)}" height="${mm(0.7)}" fill="${COLOR.accent}"/>
  </svg>`;
}

async function backSvg() {
  const glow = radialGlow("backGlow", bw - mm(18), bh - mm(16), mm(30), COLOR.accent, 0.28);
  const rows = [
    ["E.", SITE.email],
    ["W.", "lyonaistudio.fr"],
  ];
  const rowStartY = margin + mm(26.5);
  const rowGap = mm(6.4);
  let rowsSvg = "";
  rows.forEach(([label, value], i) => {
    const y = rowStartY + i * rowGap;
    rowsSvg += `
      <text x="${margin}" y="${y}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.3)}" fill="${COLOR.accent}">${esc(label)}</text>
      <text x="${margin + mm(7)}" y="${y}" font-family="${FONT.mono}" font-weight="400" font-size="${mm(3.3)}" fill="${COLOR.paperDim}">${esc(value)}</text>
    `;
  });

  const qrSize = mm(15);
  const qrX = bw - margin - qrSize;
  const qrY = bh - margin - qrSize;
  const qr = await qrDataUri(SITE.url, { dark: COLOR.ink, light: COLOR.paper, width: 500 });

  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}
    <text x="${margin}" y="${margin + mm(2.6)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(2.7)}" fill="${COLOR.accent}" letter-spacing="1.5">${esc("// LYON AI STUDIO")}</text>
    <text x="${margin}" y="${margin + mm(10.6)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(5.8)}" fill="${COLOR.paper}">${esc("Sites internet & agents IA")}</text>
    <text x="${margin}" y="${margin + mm(15.6)}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.1)}" fill="${COLOR.mist}">${esc("100% sur-mesure, partout en France")}</text>
    <rect x="${margin}" y="${margin + mm(18.6)}" width="${mm(10)}" height="${mm(0.7)}" fill="${COLOR.accent}"/>
    ${rowsSvg}
    <rect x="${qrX - mm(1.5)}" y="${qrY - mm(1.5)}" width="${qrSize + mm(3)}" height="${qrSize + mm(3)}" fill="${COLOR.paper}" rx="${mm(1.2)}"/>
    <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qr}"/>
  </svg>`;
}

await renderAndCrop({
  svg: frontSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/carte-visite-recto-fond-perdu.png",
  outTrim: "publicité/carte-visite-recto.png",
});

await renderAndCrop({
  svg: await backSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/carte-visite-verso-fond-perdu.png",
  outTrim: "publicité/carte-visite-verso.png",
});

console.log("Business card done");
