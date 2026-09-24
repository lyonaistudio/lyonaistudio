import { mm, COLOR, FONT, esc, logoMark, radialGlow, qrDataUri, renderAndCrop } from "./lib.mjs";
import { SITE } from "./site-data.mjs";

const TRIM_W = 85, TRIM_H = 55, BLEED = 3;
const BW = TRIM_W + BLEED * 2, BH = TRIM_H + BLEED * 2;
const bw = mm(BW), bh = mm(BH);
const margin = mm(BLEED + 5); // safe margin from trim edge

// Rythme vertical partagé recto/verso : mêmes paliers d'espacement, pour que
// les deux faces suivent le même système visuel.
const GAP = { tight: mm(3.4), medium: mm(6), loose: mm(8) };

function textLines(x, startY, lines, { font, weight, size, fill, lineHeight, spacing }) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${startY + i * lineHeight}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${fill}"${spacing ? ` letter-spacing="${spacing}"` : ""}>${esc(line)}</text>`
    )
    .join("\n");
}

function frontSvg() {
  const glow = radialGlow("frontGlow", mm(18), mm(16), mm(34), COLOR.accent, 0.3);
  const logoBottom = margin + mm(9);
  const eyebrowY = logoBottom + GAP.loose;
  const headlineY = eyebrowY + GAP.medium;
  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}

    ${logoMark(margin, margin, mm(9))}
    <text x="${margin + mm(11.5)}" y="${margin + mm(6.6)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(6.4)}" fill="${COLOR.paper}">${esc("Lyon AI Studio")}</text>

    <text x="${margin}" y="${eyebrowY}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(2.7)}" fill="${COLOR.accent}" letter-spacing="1.1">${esc("// CRÉATION DE SITES WEB & AGENTS IA")}</text>

    ${textLines(margin, headlineY, ["Votre site,", "vos tâches automatisées."], {
      font: FONT.display, weight: 700, size: mm(5.3), fill: COLOR.paper, lineHeight: mm(6.6),
    })}

    <rect x="${margin}" y="${bh - margin - mm(6)}" width="${mm(10)}" height="${mm(0.7)}" fill="${COLOR.accent}"/>
    <text x="${margin}" y="${bh - margin}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.1)}" fill="${COLOR.mist}">${esc("Basé à Lyon — clients partout en France")}</text>
  </svg>`;
}

function statBlock(x, y, value, labelLine) {
  return `
    <text x="${x}" y="${y}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(5.6)}" fill="${COLOR.accent}">${esc(value)}</text>
    <text x="${x}" y="${y + GAP.tight}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(2.5)}" fill="${COLOR.paperDim}">${esc(labelLine)}</text>
  `;
}

async function backSvg() {
  const glow = radialGlow("backGlow", bw - mm(16), bh - mm(14), mm(28), COLOR.accent, 0.26);
  const contentW = bw - margin * 2;

  const eyebrowY = margin + mm(2.6);
  const headlineY = eyebrowY + GAP.medium;
  const statsY = headlineY + GAP.loose;
  const statsBottomY = statsY + GAP.tight + mm(3.1);

  const stats = [
    { value: "100%", label: "sur-mesure" },
    { value: "1", label: "interlocuteur" },
    { value: "48h", label: "de réponse" },
  ];
  const colW = contentW / 3;
  const statsSvg = stats.map((s, i) => statBlock(margin + i * colW, statsY, s.value, s.label)).join("\n");

  const dividerY = statsBottomY + GAP.medium;
  const rowStartY = dividerY + GAP.medium;
  const rowGap = mm(5.4);
  const rows = [SITE.email, "lyonaistudio.fr"];
  let rowsSvg = "";
  rows.forEach((value, i) => {
    const y = rowStartY + i * rowGap;
    rowsSvg += `<text x="${margin}" y="${y}" font-family="${FONT.mono}" font-weight="400" font-size="${mm(2.9)}" fill="${COLOR.paperDim}">${esc(value)}</text>`;
  });

  const qrSize = mm(13.5);
  const qrX = bw - margin - qrSize;
  const qrY = bh - margin - qrSize;
  const qr = await qrDataUri(SITE.url, { dark: COLOR.ink, light: COLOR.paper, width: 500 });

  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}

    <text x="${margin}" y="${eyebrowY}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(2.7)}" fill="${COLOR.accent}" letter-spacing="1.1">${esc("// CE QUI NOUS DISTINGUE")}</text>
    <text x="${margin}" y="${headlineY}" font-family="${FONT.display}" font-weight="700" font-size="${mm(5)}" fill="${COLOR.paper}">${esc("Sites internet & agents IA")}</text>

    ${statsSvg}

    <line x1="${margin}" y1="${dividerY}" x2="${bw - margin}" y2="${dividerY}" stroke="${COLOR.inkLine}" stroke-width="1.5"/>

    ${rowsSvg}

    <rect x="${qrX - mm(1.5)}" y="${qrY - mm(1.5)}" width="${qrSize + mm(3)}" height="${qrSize + mm(3)}" fill="${COLOR.paper}" rx="${mm(1.2)}"/>
    <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qr}"/>
    <text x="${qrX + qrSize}" y="${qrY - mm(2.2)}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(2.3)}" fill="${COLOR.accent}" letter-spacing="0.2" text-anchor="end">${esc("SCANNEZ → DEVIS GRATUIT")}</text>
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
