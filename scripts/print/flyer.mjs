import { mm, COLOR, FONT, esc, nodeMotif, logoMark, radialGlow, qrDataUri, renderAndCrop } from "./lib.mjs";
import { SITE } from "./site-data.mjs";

const TRIM_W = 148, TRIM_H = 210, BLEED = 3;
const BW = TRIM_W + BLEED * 2, BH = TRIM_H + BLEED * 2;
const bw = mm(BW), bh = mm(BH);
const margin = mm(BLEED + 11); // safe margin from trim edge

function textLines(x, startY, lines, { font, weight, size, fill, lineHeight, spacing }) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${startY + i * lineHeight}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${fill}"${spacing ? ` letter-spacing="${spacing}"` : ""}>${esc(line)}</text>`
    )
    .join("\n");
}

function rectoSvg() {
  const contentW = bw - margin * 2;
  const glow = radialGlow("rectoGlow", bw - mm(30), mm(70), mm(60), COLOR.accent, 0.28);
  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}
    <g>${nodeMotif(21, mm(100), mm(50), mm(40), mm(65), 7)}</g>

    ${logoMark(margin, margin, mm(11))}
    <text x="${margin + mm(14)}" y="${margin + mm(7.4)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(7)}" fill="${COLOR.paper}">${esc("Lyon AI Studio")}</text>

    <text x="${margin}" y="${margin + mm(30)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(3.6)}" fill="${COLOR.accent}" letter-spacing="2">${esc("// SITES WEB & AUTOMATISATION IA")}</text>

    ${textLines(margin, margin + mm(45), ["Votre site,", "vos tâches", "automatisées."], {
      font: FONT.display, weight: 700, size: mm(9.5), fill: COLOR.paper, lineHeight: mm(11.5),
    })}

    ${textLines(margin, margin + mm(89), [
      "Création de sites internet et automatisation",
      "par IA pour les artisans, commerces et PME,",
      "partout en France.",
    ], { font: FONT.sans, weight: 500, size: mm(4.4), fill: COLOR.paperDim, lineHeight: mm(6.6) })}

    <text x="${margin}" y="${margin + mm(118)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(3.4)}" fill="${COLOR.accent}" letter-spacing="1.5">${esc("// NOS DOMAINES D'EXPERTISE")}</text>
    ${[
      "Création & refonte de site internet",
      "Automatisation & agents IA",
      "UX / UI Design",
      "Maintenance & hébergement",
      "Référencement local / SEO",
    ]
      .map((d, i) => {
        const y = margin + mm(128) + i * mm(9);
        return `
          <circle cx="${margin + mm(1.4)}" cy="${y - mm(1.5)}" r="${mm(1.1)}" fill="${COLOR.accent}"/>
          <text x="${margin + mm(5.5)}" y="${y}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(4.3)}" fill="${COLOR.paper}">${esc(d)}</text>
        `;
      })
      .join("\n")}

    <rect x="${margin}" y="${bh - margin - mm(22)}" width="${mm(14)}" height="${mm(0.9)}" fill="${COLOR.accent}"/>
    <text x="${margin}" y="${bh - margin - mm(12)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(4)}" fill="${COLOR.accent}">${esc("→ Au dos : nos services & contact")}</text>
    <text x="${margin}" y="${bh - margin}" font-family="${FONT.sans}" font-weight="400" font-size="${mm(3.6)}" fill="${COLOR.mist}">${esc("Basé à Lyon — intervention partout en France")}</text>
  </svg>`;
}

function serviceBlockClean(x, y, index, title, points) {
  const lineH = mm(6.4);
  const titleY = y + mm(9.5);
  const listStartY = titleY + mm(7.5);
  let bullets = "";
  points.forEach((p, i) => {
    const ly = listStartY + i * lineH;
    bullets += `
      <circle cx="${x + mm(5.6)}" cy="${ly - mm(1.6)}" r="${mm(0.9)}" fill="${COLOR.accent}"/>
      <text x="${x + mm(9)}" y="${ly}" font-family="${FONT.sans}" font-weight="400" font-size="${mm(3.7)}" fill="${COLOR.paperDim}">${esc(p)}</text>
    `;
  });
  const blockHeight = listStartY - y + (points.length - 1) * lineH + mm(4);
  return {
    height: blockHeight,
    svg: `
      <rect x="${x}" y="${y}" width="${mm(0.9)}" height="${blockHeight}" fill="${COLOR.accent}"/>
      <text x="${x + mm(5)}" y="${y + mm(3)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(3.2)}" fill="${COLOR.accent}">${esc(index)}</text>
      <text x="${x + mm(5)}" y="${titleY}" font-family="${FONT.display}" font-weight="700" font-size="${mm(5.6)}" fill="${COLOR.paper}">${esc(title)}</text>
      ${bullets}
    `,
  };
}

async function versoSvg() {
  const contentX = margin;

  const s1 = serviceBlockClean(contentX, margin + mm(38), "01", "Création de site internet", [
    "Design sur-mesure, pas de template générique",
    "Optimisé pour le référencement local",
    "Impeccable sur mobile",
  ]);
  const s2y = margin + mm(38) + s1.height + mm(10);
  const s2 = serviceBlockClean(contentX, s2y, "02", "Automatisation / agent IA", [
    "Réponses, prise de rendez-vous, relances",
    "Adapté à votre métier, pas générique",
    "Vous gardez la main sur l'essentiel",
  ]);

  const stepsY = s2y + s2.height + mm(14);
  const steps = ["Contact", "Échange", "Proposition", "Réalisation"];
  const stepColW = (bw - margin * 2) / steps.length;
  let stepsSvg = "";
  steps.forEach((label, i) => {
    const sx = contentX + i * stepColW;
    stepsSvg += `
      <text x="${sx}" y="${stepsY}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.4)}" fill="${COLOR.accent}">0${i + 1}</text>
      <text x="${sx}" y="${stepsY + mm(5.2)}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.5)}" fill="${COLOR.paperDim}">${esc(label)}</text>
    `;
  });
  const stepsLineY = stepsY - mm(4.5);

  const contactY = stepsY + mm(24);
  const qrSize = mm(26);
  const qr = await qrDataUri(SITE.url, { dark: COLOR.ink, light: COLOR.paper, width: 600 });

  const glow = radialGlow("versoGlow", margin, mm(30), mm(50), COLOR.accent, 0.22);

  return `
  <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg">
    <defs>${glow.defs}</defs>
    <rect width="${bw}" height="${bh}" fill="${COLOR.ink}"/>
    ${glow.use}

    ${logoMark(margin, margin, mm(8.5))}
    <text x="${margin + mm(11)}" y="${margin + mm(5.8)}" font-family="${FONT.display}" font-weight="700" font-size="${mm(5.4)}" fill="${COLOR.paper}">${esc("Lyon AI Studio")}</text>

    <text x="${margin}" y="${margin + mm(20)}" font-family="${FONT.mono}" font-weight="500" font-size="${mm(3.3)}" fill="${COLOR.accent}" letter-spacing="1.5">${esc("// CE QU'ON FAIT")}</text>
    ${textLines(margin, margin + mm(27), ["Deux services, un seul objectif :", "vous faire gagner du temps."], {
      font: FONT.display, weight: 700, size: mm(6.4), fill: COLOR.paper, lineHeight: mm(7.6),
    })}

    ${s1.svg}
    ${s2.svg}

    <line x1="${contentX}" y1="${stepsLineY}" x2="${bw - margin}" y2="${stepsLineY}" stroke="${COLOR.inkLine}" stroke-width="2"/>
    ${stepsSvg}

    <line x1="${contentX}" y1="${contactY}" x2="${bw - margin}" y2="${contactY}" stroke="${COLOR.inkLine}" stroke-width="2"/>

    <text x="${contentX}" y="${contactY + mm(11)}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.6)}" fill="${COLOR.accent}">E.</text>
    <text x="${contentX + mm(7)}" y="${contactY + mm(11)}" font-family="${FONT.mono}" font-weight="400" font-size="${mm(3.6)}" fill="${COLOR.paperDim}">${esc(SITE.email)}</text>
    <text x="${contentX}" y="${contactY + mm(18)}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.6)}" fill="${COLOR.accent}">H.</text>
    <text x="${contentX + mm(7)}" y="${contactY + mm(18)}" font-family="${FONT.mono}" font-weight="400" font-size="${mm(3.6)}" fill="${COLOR.paperDim}">${esc(SITE.hours)}</text>

    <rect x="${bw - margin - qrSize}" y="${contactY + mm(7)}" width="${qrSize}" height="${qrSize}" fill="${COLOR.paper}"/>
    <image x="${bw - margin - qrSize}" y="${contactY + mm(7)}" width="${qrSize}" height="${qrSize}" href="${qr}"/>
    <text x="${bw - margin - qrSize / 2}" y="${contactY + qrSize + mm(9)}" font-family="${FONT.mono}" font-weight="700" font-size="${mm(3.1)}" fill="${COLOR.accent}" text-anchor="middle">${esc("Scannez →")}</text>
    <text x="${bw - margin - qrSize / 2}" y="${contactY + qrSize + mm(14.5)}" font-family="${FONT.sans}" font-weight="400" font-size="${mm(3)}" fill="${COLOR.mist}" text-anchor="middle">${esc("Découvrez nos créations")}</text>

    <rect x="${contentX}" y="${bh - margin - mm(4)}" width="${mm(14)}" height="${mm(0.9)}" fill="${COLOR.accent}"/>
    <text x="${contentX}" y="${bh - margin}" font-family="${FONT.sans}" font-weight="500" font-size="${mm(3.6)}" fill="${COLOR.paper}">${esc("Demande de renseignements sans engagement")}</text>
  </svg>`;
}

await renderAndCrop({
  svg: rectoSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/flyer-recto-fond-perdu.png",
  outTrim: "publicité/flyer-recto.png",
});

await renderAndCrop({
  svg: await versoSvg(),
  bleedWmm: BW, bleedHmm: BH, trimWmm: TRIM_W, trimHmm: TRIM_H, bleedMm: BLEED,
  outBleed: "publicité/flyer-verso-fond-perdu.png",
  outTrim: "publicité/flyer-verso.png",
});

console.log("Flyer done");
