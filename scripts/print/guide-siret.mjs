// Guide pas-à-pas pour créer son SIRET (micro-entreprise) — document personnel,
// pas destiné aux clients. Rendu HTML -> PDF via Playwright, même palette de
// marque que les autres documents (voir lib.mjs).
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const OUT = "/home/thomasbatpro/lyon ia studio /creer-son-siret.pdf";

const INK = "#121110", PAPER = "#f4f1ea", PAPER_DIM = "#d9d4c8", MIST = "#93897a",
  ACCENT = "#e2672c", INK_LINE = "#2b2721", INK_SOFT = "#1a1815";

const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const STEPS = [
  {
    n: "01",
    title: "Rassembler ce qu'il faut",
    body: `Pas besoin d'être déjà en poste, ni d'avoir de l'argent de côté : il n'y a aucun capital minimum. Il vous faut simplement :`,
    list: [
      "Une pièce d'identité valide (carte d'identité ou passeport)",
      "Une adresse où domicilier l'activité — votre domicile personnel suffit pour démarrer, pas besoin d'un local pro",
      "Un email et un numéro de téléphone valides",
    ],
  },
  {
    n: "02",
    title: "Choisir son statut : la micro-entreprise",
    body: `Pour une activité solo comme la vôtre (création de sites, automatisation), la <strong>micro-entreprise</strong> (l'ancien "auto-entrepreneur") est presque toujours le bon choix pour démarrer : immatriculation gratuite, comptabilité minimale, et vous ne payez des cotisations que sur ce que vous facturez réellement — jamais à perte.`,
    tip: `Une société (SASU, EURL...) devient pertinente plus tard, si votre chiffre d'affaires dépasse durablement le plafond micro-entreprise (~77 700 € / an en prestations de services) ou si vous voulez déduire des charges réelles. Pas une priorité pour démarrer.`,
  },
  {
    n: "03",
    title: "Aller sur le site officiel — et uniquement celui-là",
    body: `Rendez-vous sur <strong>formalites.entreprises.gouv.fr</strong>. C'est le guichet unique officiel (géré par l'INPI), le seul endroit où déclarer votre activité.`,
    warn: `Attention aux sites tiers (souvent en tête des résultats Google, avec des noms du type "creation-autoentrepreneur.fr") qui imitent le service officiel et vous facturent 50 à 150 € pour un formulaire qui est <strong>gratuit</strong> sur le site du gouvernement. Vérifiez toujours l'adresse : elle doit se terminer par <strong>.gouv.fr</strong>.`,
  },
  {
    n: "04",
    title: "Créer son compte",
    body: `Inscrivez-vous avec votre email, ou connectez-vous directement via FranceConnect (impôts.gouv, Ameli, etc.) pour aller plus vite. Vous recevrez un code de confirmation par email.`,
  },
  {
    n: "05",
    title: "Remplir la déclaration d'activité",
    body: `Le formulaire vous demande : votre identité, l'adresse du siège (votre domicile), et une description de votre activité. Décrivez-la simplement, par exemple :`,
    quote: `« Création de sites internet et mise en place d'outils d'automatisation (agents IA) pour les petites entreprises. »`,
    tip: `L'INSEE attribue ensuite automatiquement un code APE (probablement 6201Z – programmation informatique, ou 6202A – conseil en systèmes informatiques) à partir de cette description. Pas besoin de le choisir vous-même.`,
  },
  {
    n: "06",
    title: "Choisir son régime social et fiscal",
    body: `Le régime <strong>micro-social</strong> est sélectionné par défaut avec le statut micro-entreprise : vous payez des cotisations en pourcentage de ce que vous encaissez, jamais un montant fixe. Le formulaire vous proposera aussi une option facultative, le <strong>versement libératoire de l'impôt sur le revenu</strong> — elle permet de payer l'impôt en même temps que les cotisations, au lieu d'une régularisation l'année suivante. Intéressant si le revenu de votre foyer est modeste ; sinon vous pouvez laisser cette case décochée sans risque, ce n'est pas définitif.`,
  },
  {
    n: "07",
    title: "Valider et envoyer",
    body: `Relisez le récapitulatif, signez électroniquement, et envoyez. C'est tout — aucun paiement ne vous sera jamais demandé à cette étape pour une micro-entreprise.`,
  },
  {
    n: "08",
    title: "Réceptionner son SIRET",
    body: `Vous recevrez un email de confirmation de dépôt, puis, sous quelques jours à trois semaines selon les périodes, un <strong>avis de situation SIRENE</strong> de l'INSEE contenant votre numéro de SIRET (14 chiffres). C'est ce numéro qui rend votre activité officiellement déclarée.`,
    warn: `Vous ne pouvez pas émettre de facture légale avant d'avoir reçu ce SIRET. Si un client presse, vous pouvez lui expliquer que l'immatriculation est en cours.`,
  },
  {
    n: "09",
    title: "Après réception : deux réflexes",
    list: [
      "Ouvrir un compte bancaire dédié à l'activité (obligatoire seulement au-delà de 10 000 € de chiffre d'affaires sur 2 années consécutives, mais conseillé dès le début pour séparer perso/pro)",
      "Créer votre espace sur autoentrepreneur.urssaf.fr pour déclarer votre chiffre d'affaires chaque mois ou trimestre — c'est là que se calculent vos cotisations",
    ],
  },
  {
    n: "10",
    title: "Mettre à jour lyonaistudio.fr",
    body: `Dès que vous avez le SIRET, il doit apparaître sur les mentions légales du site — c'est une obligation légale pour toute activité commerciale en ligne. Envoyez-le-moi et je le mets en place.`,
  },
];

const stepHtml = (s) => `
  <div class="step">
    <div class="step-num">${s.n}</div>
    <div class="step-body">
      <h2>${s.title}</h2>
      ${s.body ? `<p>${s.body}</p>` : ""}
      ${s.list ? `<ul>${s.list.map((li) => `<li>${li}</li>`).join("")}</ul>` : ""}
      ${s.quote ? `<blockquote>${s.quote}</blockquote>` : ""}
      ${s.tip ? `<div class="box tip"><span class="box-label">À savoir</span>${s.tip}</div>` : ""}
      ${s.warn ? `<div class="box warn"><span class="box-label">Attention</span>${s.warn}</div>` : ""}
    </div>
  </div>`;

const html = `
<!doctype html><html lang="fr"><head><meta charset="UTF-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; background: ${PAPER}; color: ${INK}; }

  .cover { background: ${INK}; color: ${PAPER}; padding: 70px 55px 55px; position: relative; min-height: 297mm; }
  .cover::after { content: ""; position: absolute; left: 55px; right: 55px; bottom: 0; height: 3px; background: ${ACCENT}; }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 70px; }
  .mark { width: 34px; height: 34px; border: 2px solid ${ACCENT}; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: ${ACCENT}; }
  .brand-name { font-weight: 700; font-size: 18px; }
  .eyebrow { color: ${ACCENT}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; font-weight: 600; margin-bottom: 14px; }
  h1.cover-title { font-size: 44px; font-weight: 700; margin: 0 0 18px; letter-spacing: -0.01em; max-width: 480px; line-height: 1.15; }
  .cover-sub { color: ${PAPER_DIM}; font-size: 15px; max-width: 420px; line-height: 1.6; margin: 0 0 50px; }
  .stats { display: flex; gap: 44px; }
  .stat-num { font-size: 26px; font-weight: 700; color: ${ACCENT}; }
  .stat-label { font-size: 10.5px; color: ${MIST}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .cover-footer { position: absolute; bottom: 55px; left: 55px; right: 55px; display: flex; justify-content: space-between; font-size: 10px; color: ${MIST}; padding-top: 16px; }

  .content { padding: 46px 55px 55px; }
  .step { display: flex; gap: 22px; margin-bottom: 34px; page-break-inside: avoid; }
  .step-num { font-family: "Courier New", monospace; font-size: 13px; font-weight: 700; color: ${ACCENT}; border: 1.5px solid ${ACCENT}; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-body { flex: 1; padding-top: 2px; }
  h2 { font-size: 15.5px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.005em; }
  p { font-size: 11.5px; line-height: 1.65; margin: 0 0 6px; color: #2c2823; }
  ul { margin: 8px 0 0; padding-left: 18px; }
  li { font-size: 11.5px; line-height: 1.6; margin-bottom: 5px; color: #2c2823; }
  blockquote { margin: 10px 0; padding: 10px 14px; background: ${PAPER_DIM}55; border-left: 3px solid ${ACCENT}; font-style: italic; font-size: 11.5px; color: #3a352e; }
  .box { margin-top: 10px; padding: 10px 14px; border-radius: 6px; font-size: 10.5px; line-height: 1.6; }
  .box-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .box.tip { background: ${PAPER_DIM}55; color: #3a352e; }
  .box.tip .box-label { color: ${MIST}; }
  .box.warn { background: ${ACCENT}14; color: #5c2c10; border: 1px solid ${ACCENT}44; }
  .box.warn .box-label { color: ${ACCENT}; }

  footer { padding: 20px 55px; border-top: 1px solid ${INK_LINE}; background: ${INK_SOFT}; color: ${MIST}; font-size: 9px; display: flex; justify-content: space-between; }
</style></head><body>

  <div class="cover">
    <div class="brand"><div class="mark">L</div><div class="brand-name">Lyon AI Studio</div></div>
    <div class="eyebrow">Guide administratif</div>
    <h1 class="cover-title">Créer son SIRET, étape par étape</h1>
    <p class="cover-sub">Le guide pour immatriculer votre activité en micro-entreprise, du premier clic jusqu'à la mise à jour du site — sans jargon, sans piège.</p>
    <div class="stats">
      <div><div class="stat-num">0 €</div><div class="stat-label">Coût réel</div></div>
      <div><div class="stat-num">10</div><div class="stat-label">Étapes</div></div>
      <div><div class="stat-num">~15 j</div><div class="stat-label">Délai moyen</div></div>
    </div>
    <div class="cover-footer"><span>Généré le ${today}</span><span>Usage personnel</span></div>
  </div>

  <div class="content">
    ${STEPS.map(stepHtml).join("")}
  </div>

  <footer><span>Lyon AI Studio — lyonaistudio@gmail.com</span><span>lyonaistudio.fr</span></footer>
</body></html>`;

const tmpHtml = "/tmp/guide-siret-render.html";
writeFileSync(tmpHtml, html, "utf-8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle" });
await page.pdf({ path: OUT, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();

console.log("PDF écrit dans", OUT);
