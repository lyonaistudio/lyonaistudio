import { mm, COLOR, FONT, esc, gridMotif, nodeMotif, logoMark, renderAndCrop } from "./lib.mjs";
import { SITE } from "./site-data.mjs";

const TRIM_W = 85, TRIM_H = 55, BLEED = 3;
const BW = TRIM_W + BLEED * 2, BH = TRIM_H + BLEED * 2;
const bw = mm(BW), bh = mm(BH);
const margin = mm(BLEED + 5); // safe margin from trim edge

function frontSvg() {
  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    <g>${gridMotif(bw, bh, mm(8), 0.5)}</g>
    <g>${nodeMotif(5, bw - mm(38), bh - mm(30), mm(30), mm(22), 5)}</g>
    ${logoMark(margin, margin, mm(9))}
    <text x="${margin + mm(11.5)}" y="${margin + mm(6.6)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(6.4)}" fill="${COLOR.paper}">${esc("Lyon AI Studio")}</text>
    <text x="${margin}" y="${bh - margin}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.3)}" fill="${COLOR.mist}">${esc("Sites internet & automatisation IA")}</text>
    <rect x="${margin}" y="${bh - margin - mm(6)}" width="${mm(10)}" height="${mm(0.7)}" fill="${COLOR.accent}"/>
  </svg>`;
}

function backSvg() {
  const rows = [
    ["T.", SITE.phone],
    ["E.", SITE.email],
    ["W.", "lyonaistudio.fr"],
  ];
  const rowStartY = mm(30);
  const rowGap = mm(6.4);
  let rowsSvg = "";
  rows.forEach(([label, value], i) => {
    const y = rowStartY + i * rowGap;
    rowsSvg += `
      <text x="${margin}" y="${y}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.3)}" fill="${COLOR.accent}">${esc(label)}</text>
      <text x="${margin + mm(7)}" y="${y}" font-family="${FONT.mono}" font-weight="400" font-size="${mm(3.3)}" fill="${COLOR.paperDim}">${esc(value)}</text>
    `;
  });

  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    <g>${gridMotif(bw, bh, mm(8), 0.5)}</g>
    <text x="${margin}" y="${margin + mm(2.6)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(2.7)}" fill="${COLOR.accent}" letter-spacing="1.5">${esc("// LYON AI STUDIO")}</text>
    <text x="${margin}" y="${margin + mm(9.4)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(6.8)}" fill="${COLOR.paper}">${esc("Thomas Batisse")}</text>
    <text x="${margin}" y="${margin + mm(13.6)}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.1)}" fill="${COLOR.mist}">${esc("Sites internet & automatisation IA")}</text>
    <rect x="${margin}" y="${margin + mm(16.8)}" width="${mm(10)}" height="${mm(0.7)}" fill="${COLOR.accent}"/>
    ${rowsSvg}
    ${logoMark(bw - margin - mm(8), bh - margin - mm(8), mm(8))}
  </svg>`;
}

await renderAndCrop({
  svg: frontSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/carte-visite-recto-fond-perdu.png",
  outTrim: "publicité/carte-visite-recto.png",
});

await renderAndCrop({
  svg: backSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/carte-visite-verso-fond-perdu.png",
  outTrim: "publicité/carte-visite-verso.png",
});

console.log("Business card done");
