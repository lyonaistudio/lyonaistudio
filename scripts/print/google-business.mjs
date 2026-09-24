// Logo + photos de couverture pour la fiche Google Business Profile —
// même identité visuelle que le reste (voir lib.mjs). Carrées (1200x1200) :
// un format 16:9 se faisait recadrer et coupait le texte dans les aperçus.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COLOR, FONT, esc, logoMark, radialGlow } from "./lib.mjs";
import { SITE } from "./site-data.mjs";

const OUT_DIR = "google business";
mkdirSync(OUT_DIR, { recursive: true });

const CW = 1200, CH = 1200;
const MARGIN = 110;

// ---------- Logo (carré, 1024x1024) ----------

const LOGO_SIZE = 1024;

function logoSvg() {
  const mark = Math.round(LOGO_SIZE * 0.8);
  const offset = Math.round((LOGO_SIZE - mark) / 2);
  return `
  <svg width="${LOGO_SIZE}" height="${LOGO_SIZE}" viewBox="0 0 ${LOGO_SIZE} ${LOGO_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${LOGO_SIZE}" height="${LOGO_SIZE}" fill="${COLOR.ink}"/>
    ${logoMark(offset, offset, mark)}
  </svg>`;
}

await sharp(Buffer.from(logoSvg())).png().toFile(`${OUT_DIR}/logo.png`);

// ---------- Base commune des couvertures ----------

function headerSvg(glowCx = 0.5, glowCy = 0.38) {
  const glow = radialGlow("g", CW * glowCx, CH * glowCy, CW * 0.55, COLOR.accent, 0.32);
  return {
    defs: glow.defs,
    body: `
      <rect width="${CW}" height="${CH}" fill="${COLOR.ink}"/>
      ${glow.use}
      ${logoMark(MARGIN, MARGIN, 78)}
      <text x="${MARGIN + 96}" y="${MARGIN + 54}" font-family="${FONT.display}" font-weight="700" font-size="44" fill="${COLOR.paper}">${esc(SITE.name)}</text>
    `,
  };
}

async function render(name, bodySvg, glowCx, glowCy) {
  const { defs, body } = headerSvg(glowCx, glowCy);
  const svg = `
  <svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    ${body}
    ${bodySvg}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT_DIR}/${name}.png`);
}

// ---------- 1. Accroche ----------

await render(
  "cover-1-accroche",
  `
  <text x="${MARGIN}" y="${CH * 0.46}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// CRÉATION DE SITES WEB & AGENTS IA")}</text>
  <text x="${MARGIN}" y="${CH * 0.57}" font-family="${FONT.display}" font-weight="700" font-size="56" fill="${COLOR.paper}">${esc("Votre site,")}</text>
  <text x="${MARGIN}" y="${CH * 0.57 + 68}" font-family="${FONT.display}" font-weight="700" font-size="56" fill="${COLOR.paper}">${esc("vos tâches automatisées.")}</text>
  <rect x="${MARGIN}" y="${CH * 0.74}" width="90" height="6" fill="${COLOR.accent}"/>
  <text x="${MARGIN}" y="${CH * 0.74 + 40}" font-family="${FONT.sans}" font-weight="500" font-size="26" fill="${COLOR.mist}">${esc("Basé à Lyon — clients partout en France")}</text>
  `
);

// ---------- 2. Domaines d'expertise ----------

const DOMAINES = [
  "Création & refonte de site internet",
  "Automatisation & agents IA",
  "UX / UI Design",
  "Maintenance & hébergement",
  "Référencement local / SEO",
];

await render(
  "cover-2-domaines",
  `
  <text x="${MARGIN}" y="${CH * 0.4}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// NOS DOMAINES D'EXPERTISE")}</text>
  <text x="${MARGIN}" y="${CH * 0.47}" font-family="${FONT.display}" font-weight="700" font-size="46" fill="${COLOR.paper}">${esc("Sites internet & agents IA")}</text>
  ${DOMAINES.map((d, i) => {
    const y = CH * 0.56 + i * 62;
    return `
      <circle cx="${MARGIN + 8}" cy="${y - 10}" r="7" fill="${COLOR.accent}"/>
      <text x="${MARGIN + 32}" y="${y}" font-family="${FONT.sans}" font-weight="500" font-size="32" fill="${COLOR.paper}">${esc(d)}</text>
    `;
  }).join("")}
  `,
  0.75,
  0.3
);

// ---------- 3. Pourquoi Lyon AI Studio (chiffres) ----------

const STATS = [
  ["100%", "sur-mesure"],
  ["1", "interlocuteur unique"],
  ["48h", "délai de réponse"],
];

await render(
  "cover-3-pourquoi",
  `
  <text x="${MARGIN}" y="${CH * 0.42}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// CE QUI NOUS DISTINGUE")}</text>
  <text x="${MARGIN}" y="${CH * 0.49}" font-family="${FONT.display}" font-weight="700" font-size="46" fill="${COLOR.paper}">${esc("Pourquoi Lyon AI Studio")}</text>
  ${STATS.map(([value, label], i) => {
    const y = CH * 0.6 + i * 100;
    return `
      <text x="${MARGIN}" y="${y}" font-family="${FONT.mono}" font-weight="700" font-size="52" fill="${COLOR.accent}">${esc(value)}</text>
      <text x="${MARGIN + 160}" y="${y}" font-family="${FONT.sans}" font-weight="500" font-size="30" fill="${COLOR.paper}">${esc(label)}</text>
    `;
  }).join("")}
  `
);

// ---------- 4. Comment ça se passe (étapes) ----------

const STEPS = ["Contact", "Échange", "Proposition", "Réalisation"];

await render(
  "cover-4-etapes",
  `
  <text x="${MARGIN}" y="${CH * 0.42}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// COMMENT ÇA SE PASSE")}</text>
  <text x="${MARGIN}" y="${CH * 0.49}" font-family="${FONT.display}" font-weight="700" font-size="46" fill="${COLOR.paper}">${esc("Un parcours simple, en 4 étapes")}</text>
  ${STEPS.map((s, i) => {
    const y = CH * 0.6 + i * 95;
    return `
      <text x="${MARGIN}" y="${y}" font-family="${FONT.mono}" font-weight="700" font-size="30" fill="${COLOR.accent}">0${i + 1}</text>
      <text x="${MARGIN + 80}" y="${y}" font-family="${FONT.sans}" font-weight="600" font-size="34" fill="${COLOR.paper}">${esc(s)}</text>
    `;
  }).join("")}
  `,
  0.3,
  0.65
);

// ---------- 5. Contact ----------

await render(
  "cover-5-contact",
  `
  <text x="${MARGIN}" y="${CH * 0.46}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// ON EN PARLE ?")}</text>
  <text x="${MARGIN}" y="${CH * 0.55}" font-family="${FONT.display}" font-weight="700" font-size="52" fill="${COLOR.paper}">${esc("Décrivez votre projet,")}</text>
  <text x="${MARGIN}" y="${CH * 0.55 + 62}" font-family="${FONT.display}" font-weight="700" font-size="52" fill="${COLOR.paper}">${esc("on en discute.")}</text>
  <rect x="${MARGIN}" y="${CH * 0.71}" width="90" height="6" fill="${COLOR.accent}"/>
  <text x="${MARGIN}" y="${CH * 0.71 + 46}" font-family="${FONT.mono}" font-weight="700" font-size="26" fill="${COLOR.accent}">E.</text>
  <text x="${MARGIN + 44}" y="${CH * 0.71 + 46}" font-family="${FONT.mono}" font-weight="400" font-size="26" fill="${COLOR.paper}">${esc(SITE.email)}</text>
  <text x="${MARGIN}" y="${CH * 0.71 + 84}" font-family="${FONT.mono}" font-weight="700" font-size="26" fill="${COLOR.accent}">W.</text>
  <text x="${MARGIN + 44}" y="${CH * 0.71 + 84}" font-family="${FONT.mono}" font-weight="400" font-size="26" fill="${COLOR.paper}">lyonaistudio.fr</text>
  `
);

// ---------- 6. Vitrine (mockup du site, plutôt que du texte seul) ----------

const LAPTOP_SRC = fileURLToPath(new URL("../../src/assets/mockups/laptop-lyonaistudio.webp", import.meta.url));
const laptopMeta = await sharp(LAPTOP_SRC).metadata();
const imgW = 900;
const imgH = Math.round(imgW * (laptopMeta.height / laptopMeta.width));
const imgX = Math.round((CW - imgW) / 2);
const imgY = 400;

{
  const { defs, body } = headerSvg(0.5, 0.28);
  const baseSvg = `
  <svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    ${body}
    <text x="${MARGIN}" y="${CH * 0.235}" font-family="${FONT.mono}" font-weight="500" font-size="22" fill="${COLOR.accent}" letter-spacing="3">${esc("// NOTRE SAVOIR-FAIRE")}</text>
    <text x="${MARGIN}" y="${CH * 0.3}" font-family="${FONT.display}" font-weight="700" font-size="42" fill="${COLOR.paper}">${esc("Un site qui vous représente.")}</text>
    <text x="${CW / 2}" y="${imgY + imgH + 70}" text-anchor="middle" font-family="${FONT.sans}" font-weight="500" font-size="28" fill="${COLOR.mist}">${esc("Sites internet & agents IA — sur-mesure, partout en France")}</text>
  </svg>`;

  const base = await sharp(Buffer.from(baseSvg)).png().toBuffer();
  const laptop = await sharp(LAPTOP_SRC).resize({ width: imgW }).toBuffer();

  await sharp(base)
    .composite([{ input: laptop, left: imgX, top: imgY }])
    .png()
    .toFile(`${OUT_DIR}/cover-6-vitrine.png`);
}

console.log(`Logo et 6 couvertures écrits dans ${OUT_DIR}/`);
