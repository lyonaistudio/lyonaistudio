// Guide "SEO Google" — être visible gratuitement (SEO) + Google Ads (payant),
// pas à pas pour un débutant. Rendu HTML -> PDF via le Chromium déjà présent
// dans le cache Playwright (pas de dépendance supplémentaire à installer).
// Même palette de marque que le site actuel (voir scripts/print/lib.mjs).
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../seo-google.pdf");
const CHROME = "/home/thomasbatpro/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

const INK = "#0a0a0a", INK_SOFT = "#161616", INK_LINE = "#e7e5e3", PAPER = "#ffffff",
  PAPER_DIM = "#f4f2f0", MIST = "#6b6b6b", ACCENT = "#e6003a", ACCENT_SOFT = "#ff3860",
  TEXT = "#242220";

const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// ---------- petits composants réutilisables ----------

function icon(path, size = 26) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${ACCENT}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const ICONS = {
  seo: icon(`<circle cx="10" cy="10" r="6.5"/><line x1="19" y1="19" x2="14.8" y2="14.8"/>`),
  pin: icon(`<path d="M12 21s-6.5-6-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.3"/>`),
  ads: icon(`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="0.6" fill="${ACCENT}"/>`),
  check: icon(`<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8 12.5l2.7 2.7L16.3 9"/>`),
  book: icon(`<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5Z"/>`),
  bulb: icon(`<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.5 1 .5 1.6v.5h6v-.5c0-.6 0-1.2.5-1.6A6 6 0 0 0 12 3Z"/>`),
};

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Vrai lien cliquable dans le PDF (Chromium conserve les <a href> lors de
// l'impression en PDF) — le libellé affiché reste court et lisible, l'URL
// complète est dans le href.
function link(url, label) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return `<a class="inline-link" href="${esc(href)}">${esc(label || url)}</a>`;
}

function mock(url, btnLabel, note) {
  return `
  <div class="mock">
    <div class="mock-bar">
      <span class="mock-dot"></span><span class="mock-dot"></span><span class="mock-dot"></span>
      <div class="mock-url">${link(url, url)}</div>
    </div>
    <div class="mock-body">
      <span class="mock-btn">${esc(btnLabel)}</span>
      <span class="mock-point"><span class="tri"></span>${esc(note || "cliquez ici")}</span>
    </div>
  </div>`;
}

function stepHtml(s) {
  return `
  <div class="step">
    <div class="step-num">${s.n}</div>
    <div class="step-body">
      <h3>${s.title}</h3>
      ${s.body ? `<p>${s.body}</p>` : ""}
      ${s.mock ? mock(s.mock.url, s.mock.btn, s.mock.note) : ""}
      ${s.list ? `<ul>${s.list.map((li) => `<li>${li}</li>`).join("")}</ul>` : ""}
      ${s.tip ? `<div class="box tip"><span class="box-label">Astuce</span>${s.tip}</div>` : ""}
      ${s.warn ? `<div class="box warn"><span class="box-label">Attention</span>${s.warn}</div>` : ""}
    </div>
  </div>`;
}

function partHeader(iconKey, eyebrow, title, sub) {
  return `
  <div class="part-header">
    <div class="part-icon">${ICONS[iconKey]}</div>
    <div>
      <div class="eyebrow">${eyebrow}</div>
      <h2 class="part-title">${title}</h2>
      <p class="part-sub">${sub}</p>
    </div>
  </div>`;
}

// ---------- contenu ----------

const SEO_STEPS = [
  {
    n: "01",
    title: "Créer votre compte Google Search Console",
    body: `Search Console, c'est l'outil <strong>gratuit</strong> de Google qui vous dit si votre site est bien vu et compris par ses robots. Rendez-vous sur ${link("search.google.com/search-console", "search.google.com/search-console")}, connectez-vous avec un compte Google, puis cliquez sur « Ajouter une propriété » et choisissez <strong>« Préfixe d'URL »</strong> (plus simple que « Domaine »). Entrez l'adresse complète de votre site.`,
    mock: { url: "search.google.com/search-console", btn: "+ Ajouter une propriété", note: "cliquez ici" },
    tip: `Si Lyon AI Studio a créé votre site, cette vérification est en général déjà en place — vous pouvez nous demander de vous donner l'accès plutôt que de tout recréer.`,
  },
  {
    n: "02",
    title: "Vérifier que le site vous appartient",
    body: `Google doit s'assurer que vous êtes bien le propriétaire du site avant de vous montrer ses données. La méthode la plus simple est la <strong>balise HTML</strong> : Google vous donne une ligne de code à coller dans le site, une seule fois. C'est une manipulation technique — transmettez-la à la personne qui gère votre site si ce n'est pas vous.`,
  },
  {
    n: "03",
    title: "Envoyer votre sitemap",
    body: `Le sitemap est une simple liste de toutes les pages de votre site — il aide Google à les trouver plus vite. Dans le menu de gauche, cliquez sur <strong>« Sitemaps »</strong>, puis entrez l'adresse de votre sitemap et validez.`,
    mock: { url: "search.google.com/search-console/sitemaps", btn: "Envoyer", note: "coller l'adresse puis valider" },
    tip: `Pour un site réalisé par Lyon AI Studio, l'adresse est presque toujours <strong>votredomaine.fr/sitemap-index.xml</strong>.`,
  },
  {
    n: "04",
    title: "Demander l'indexation de vos pages importantes",
    body: `En haut de Search Console, une barre « Inspection d'URL » permet de coller l'adresse d'une page (commencez par la page d'accueil) et de cliquer sur <strong>« Demander une indexation »</strong>. Cela n'est pas instantané, mais ça accélère nettement la découverte par Google — refaites-le pour chaque nouvelle page importante (nouveau service, nouvel article de blog).`,
  },
  {
    n: "05",
    title: "Créer votre fiche Google Business Profile",
    body: `C'est <strong>l'étape la plus importante pour être trouvé localement</strong> (« plombier Lyon », « créateur de site Lyon »…) — souvent plus consultée que le site lui-même. Rendez-vous sur ${link("business.google.com", "business.google.com")}, recherchez le nom de votre entreprise (une fiche existe parfois déjà, créée automatiquement par Google) pour la revendiquer, ou créez-en une nouvelle.`,
    mock: { url: "business.google.com", btn: "Gérer maintenant", note: "cliquez ici" },
  },
  {
    n: "06",
    title: "Remplir la fiche entièrement",
    body: `Plus une fiche est complète, plus Google la met en avant. Renseignez :`,
    list: [
      "Le nom exact de votre entreprise et une catégorie d'activité précise",
      "Votre adresse, ou une zone de service si vous n'accueillez pas de public (case « Je livre des biens et services »)",
      "Votre site web, votre téléphone, vos horaires réels",
      "Au moins 5 photos (logo, équipe, réalisations) et une description avec votre métier + votre ville",
    ],
  },
  {
    n: "07",
    title: "Valider la fiche",
    body: `Google envoie un code de vérification, le plus souvent par <strong>courrier postal</strong> (parfois par téléphone ou email selon l'activité) à l'adresse indiquée. Comptez quelques jours à deux semaines. Une fois le code reçu, entrez-le dans votre compte pour que la fiche devienne publique.`,
  },
  {
    n: "08",
    title: "Collecter des avis clients",
    body: `Les avis sont l'un des critères qui pèsent le plus dans les recherches locales. Dans votre tableau de bord Google Business Profile, copiez le <strong>« lien pour obtenir des avis »</strong> et envoyez-le par SMS ou email à chaque client satisfait, juste après une mission.`,
    warn: `N'achetez jamais de faux avis et ne créez pas de faux comptes pour vous noter vous-même : Google les détecte et peut suspendre la fiche.`,
  },
  {
    n: "09",
    title: "Nourrir le site régulièrement",
    body: `Google favorise les sites qui bougent. Un rythme simple à tenir : <strong>un article de blog par mois</strong> minimum, sur un sujet lié à votre métier et votre ville. Répondez aussi à chaque avis client (bon ou mauvais) — c'est un signal d'activité pour Google.`,
    tip: `Chercher des liens depuis d'autres sites (annuaires locaux, CCI, partenaires, Pages Jaunes, LinkedIn) aide aussi beaucoup : chaque lien est un peu comme un vote de confiance pour votre site.`,
  },
];

const ADS_STEPS = [
  {
    n: "10",
    title: "Créer votre compte Google Ads",
    body: `Rendez-vous sur ${link("ads.google.com", "ads.google.com")} et cliquez sur « Commencer maintenant ». Google va vous proposer un assistant simplifié (« Smart Campaign ») — <strong>plus cher et moins précis</strong> qu'une campagne classique. Cherchez le lien discret en bas de l'écran, souvent intitulé <strong>« Passer en mode expert »</strong> ou « Changer d'objectif », pour garder le contrôle.`,
    mock: { url: "ads.google.com", btn: "Passer en mode expert", note: "lien en petit, en bas de l'écran" },
  },
  {
    n: "11",
    title: "Choisir le bon type de campagne",
    body: `Pour démarrer, choisissez une campagne <strong>« Recherche »</strong> : votre annonce n'apparaît que quand quelqu'un tape une recherche liée à votre activité, et vous ne payez qu'au clic. Évitez au début le « Réseau Display » et le « Performance Max » — moins de contrôle, budget consommé plus vite pour un résultat moins prévisible.`,
  },
  {
    n: "12",
    title: "Choisir vos mots-clés",
    body: `Utilisez l'outil gratuit <strong>« Planificateur de mots-clés »</strong> (menu Outils → Planification) pour trouver des mots-clés précis liés à votre métier et votre ville — plutôt que des mots-clés génériques, trop chers et trop concurrentiels.`,
    list: [
      `Préférez la <strong>« requête exacte »</strong> [entre crochets] ou <strong>« expression exacte »</strong> ("entre guillemets") à la « requête large », qui déclenche l'annonce sur des recherches trop éloignées`,
      `Ajoutez des <strong>mots-clés à exclure</strong> (ex. « gratuit », « emploi », « formation ») pour ne pas payer des clics hors sujet`,
    ],
  },
  {
    n: "13",
    title: "Fixer un budget prudent",
    body: `Démarrez petit pour tester : <strong>5 à 10 € par jour</strong> suffisent pour voir comment vos mots-clés se comportent. Ajustez après une à deux semaines selon les résultats, jamais avant.`,
    warn: `Vérifiez le compte au moins une fois par semaine les deux premiers mois. Un mot-clé mal ciblé peut consommer tout le budget en quelques jours sans amener un seul contact réel.`,
  },
  {
    n: "14",
    title: "Rédiger l'annonce",
    body: `Rédigez plusieurs titres (Google en teste les combinaisons automatiquement) et descriptions, avec un appel à l'action clair : « Devis gratuit », « Appelez maintenant ». Ajoutez ensuite des <strong>extensions</strong>, gratuites et très efficaces :`,
    list: [
      "Extension d'appel : votre numéro de téléphone cliquable",
      "Extension de lieu : votre adresse ou zone d'intervention",
      "Extension de liens annexes : des liens vers vos pages de services",
    ],
  },
  {
    n: "15",
    title: "Suivre les vrais résultats",
    body: `L'étape la plus souvent oubliée par les débutants — et la plus importante. Sans elle, impossible de savoir si l'argent dépensé rapporte vraiment. Dans Google Ads, allez dans <strong>Outils → Conversions</strong> et configurez un suivi sur l'envoi du formulaire de contact ou sur les appels téléphoniques.`,
    tip: `Reliez aussi votre compte Google Ads à Google Analytics (déjà en place sur les sites Lyon AI Studio) pour voir précisément quels clics deviennent de vrais contacts.`,
  },
];

const MORE_STEPS = [
  {
    n: "16",
    title: "Suivre vos progrès dans Search Console",
    body: `Search Console ne sert pas qu'à l'indexation : son rapport <strong>« Performances »</strong> (menu de gauche) montre, semaine après semaine, combien de fois votre site est apparu dans Google (impressions), combien de clics il a reçus, et à quelle position moyenne. C'est la seule façon de savoir si votre SEO avance réellement.`,
    mock: { url: "search.google.com/search-console", btn: "Performances", note: "menu de gauche" },
    tip: `Regardez ce rapport une fois par mois, pas plus souvent — le référencement bouge lentement, y regarder chaque jour ne fait que stresser pour rien. Cliquez sur « Requêtes » pour voir les mots exacts tapés par les internautes qui tombent sur votre site.`,
  },
  {
    n: "17",
    title: "Trouver quoi écrire dans votre blog",
    body: `Le Planificateur de mots-clés (vu à l'étape 12, dans votre compte Google Ads) ne sert pas qu'aux annonces payantes : il montre aussi combien de fois par mois les gens recherchent une expression donnée — une mine d'idées d'articles gratuite. Deux autres réflexes simples et gratuits :`,
    list: [
      `Tapez le début d'une recherche liée à votre métier dans Google et regardez les suggestions automatiques, ainsi que le bloc <strong>« Autres questions posées »</strong> qui apparaît dans les résultats — ce sont de vraies questions que les gens se posent`,
      `${link("trends.google.fr", "trends.google.fr")} (Google Trends) montre si l'intérêt pour un sujet monte, descend, ou est saisonnier — utile pour savoir quand publier`,
    ],
  },
  {
    n: "18",
    title: "Être présent sur les annuaires locaux (citations)",
    body: `Chaque site qui mentionne le nom, l'adresse et le téléphone de votre entreprise — même sans lien vers votre site — est un signal de confiance supplémentaire pour Google, appelé une <strong>« citation locale »</strong>. Les incontournables à vérifier ou compléter :`,
    list: [
      `${link("pagesjaunes.fr", "pagesjaunes.fr")} — recherchez votre entreprise, puis « Ajouter ou revendiquer mon établissement » si elle n'apparaît pas déjà`,
      `${link("annuaire-entreprises.data.gouv.fr", "annuaire-entreprises.data.gouv.fr")} — la fiche officielle générée automatiquement à partir de votre SIRET ; vérifiez juste qu'elle est à jour`,
      `${link("linkedin.com", "linkedin.com")} — une page entreprise, même simple, avec un lien vers votre site`,
    ],
    warn: `Le nom, l'adresse et le téléphone doivent être <strong>identiques au caractère près</strong> partout (on appelle ça la cohérence « NAP »). « 12 rue de la République » et « 12 rue République » comptent comme deux adresses différentes pour Google.`,
  },
  {
    n: "19",
    title: "Ce qui est déjà pris en charge techniquement",
    body: `Google regarde aussi des critères purement techniques — mais si votre site a été réalisé par Lyon AI Studio, ils sont déjà couverts, vous n'avez rien à faire :`,
    list: [
      "Vitesse de chargement du site",
      "Bon affichage sur mobile (la majorité des recherches s'y font)",
      "Données structurées (« schema.org ») qui aident Google à comprendre qui vous êtes",
      "Connexion sécurisée (https)",
    ],
    tip: `Si votre site a été fait ailleurs et que vous avez un doute, l'outil gratuit <strong>PageSpeed Insights</strong> (${link("pagespeed.web.dev", "pagespeed.web.dev")}) donne une note de vitesse mobile en collant simplement votre adresse.`,
  },
  {
    n: "20",
    title: "Le petit coup de pouce des réseaux sociaux",
    body: `Poster sur les réseaux sociaux n'améliore pas directement votre position dans Google, mais ça aide indirectement : plus de personnes tapent le nom de votre entreprise dans la barre de recherche (un signal que Google apprécie), et chaque profil bien rempli renforce encore la cohérence de vos informations partout sur le web.`,
    tip: `Ajoutez vos liens de réseaux sociaux dans la fiche Google Business Profile (section « Profils ») — c'est gratuit et ça prend deux minutes.`,
  },
];

const CHECKLIST = [
  "Compte Google Search Console créé et site vérifié",
  "Sitemap envoyé dans Search Console",
  "Indexation de la page d'accueil demandée",
  "Fiche Google Business Profile créée",
  "Fiche vérifiée (code postal reçu et validé)",
  "Au moins 5 photos ajoutées à la fiche",
  "Lien pour avis clients envoyé aux premiers clients",
  "Un article de blog publié ce mois-ci",
  "Compte Google Ads créé en mode expert",
  "Campagne « Recherche » lancée avec des mots-clés précis",
  "Mots-clés à exclure ajoutés",
  "Suivi des conversions configuré",
  "Rapport « Performances » de Search Console consulté",
  "Fiche PagesJaunes créée ou revendiquée",
  "Fiche annuaire-entreprises.data.gouv.fr vérifiée",
  "Nom / adresse / téléphone identiques sur tous les annuaires (NAP)",
  "Page LinkedIn entreprise créée avec un lien vers le site",
  "Liens réseaux sociaux ajoutés à la fiche Google Business Profile",
];

const GLOSSARY = [
  ["SEO", "Search Engine Optimization : le référencement naturel — apparaître dans les résultats gratuits de Google, sans payer."],
  ["SEA / Ads", "Search Engine Advertising : les annonces payantes, affichées en haut des résultats avec la mention « Annonce »."],
  ["SERP", "La page de résultats de Google (Search Engine Results Page) — ce que vous voyez après une recherche."],
  ["Indexation", "Le moment où Google « connaît » une page et peut la faire apparaître dans ses résultats."],
  ["Mot-clé", "Les mots qu'une personne tape dans la barre de recherche."],
  ["CTR", "Taux de clic : le pourcentage de personnes qui cliquent sur votre résultat ou votre annonce après l'avoir vu."],
  ["Conversion", "Le moment où un visiteur devient un contact réel : formulaire envoyé, appel passé."],
  ["Sitemap", "Un fichier qui liste toutes les pages de votre site, pour aider Google à les trouver plus vite."],
  ["Citation locale", "Une mention de votre nom, adresse et téléphone sur un site tiers (annuaire...), avec ou sans lien — un signal de confiance pour Google."],
  ["NAP", "Name, Address, Phone : vos coordonnées, qui doivent être écrites à l'identique partout où elles apparaissent sur le web."],
  ["Position moyenne", "Le rang moyen auquel votre site apparaît dans les résultats Google pour une recherche donnée (visible dans Search Console)."],
];

// ---------- page HTML ----------

const html = `
<!doctype html><html lang="fr"><head><meta charset="UTF-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; background: ${PAPER}; color: ${TEXT}; }

  .cover { background: ${INK}; color: ${PAPER}; padding: 70px 55px 55px; position: relative; min-height: 297mm; overflow: hidden; }
  .cover::before { content:""; position:absolute; top:-120px; left:-120px; width:420px; height:420px; border-radius:50%;
    background: radial-gradient(circle, ${ACCENT}55 0%, transparent 70%); }
  .cover::after { content: ""; position: absolute; left: 55px; right: 55px; bottom: 0; height: 3px; background: ${ACCENT}; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 90px; position:relative; z-index:1; }
  .mark { width: 34px; height: 34px; background:${INK_SOFT}; border:2px solid ${INK_LINE}33; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: ${ACCENT}; }
  .brand-name { font-weight: 700; font-size: 17px; }
  .eyebrow { color: ${ACCENT}; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11.5px; font-weight: 700; margin-bottom: 14px; }
  h1.cover-title { font-size: 46px; font-weight: 800; margin: 0 0 18px; letter-spacing: -0.01em; max-width: 480px; line-height: 1.12; position:relative; z-index:1; }
  .cover-sub { color: #cfcfcf; font-size: 15px; max-width: 420px; line-height: 1.65; margin: 0 0 54px; position:relative; z-index:1; }
  .stats { display: flex; gap: 44px; position:relative; z-index:1; }
  .stat-num { font-size: 27px; font-weight: 800; color: ${ACCENT}; }
  .stat-label { font-size: 10.5px; color: #9a9a9a; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .cover-footer { position: absolute; bottom: 55px; left: 55px; right: 55px; display: flex; justify-content: space-between; font-size: 10px; color: #8a8a8a; padding-top: 16px; }

  .page { padding: 50px 55px 65px; min-height: 297mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  .intro-cols { display:flex; gap: 22px; margin-top: 22px; }
  .intro-col { flex:1; border-radius: 14px; padding: 22px 20px; }
  .intro-col.free { background: ${PAPER_DIM}; border: 1px solid ${INK_LINE}; }
  .intro-col.paid { background: ${INK}; color: ${PAPER}; }
  .intro-col h3 { margin: 0 0 8px; font-size: 15px; font-weight: 800; }
  .intro-col.paid h3 { color: ${ACCENT_SOFT}; }
  .intro-col.free h3 { color: ${ACCENT}; }
  .intro-col p { font-size: 11.5px; line-height: 1.6; margin: 0; }
  .intro-col.paid p { color: #d8d8d8; }
  .intro-note { margin-top: 20px; padding: 14px 18px; border-left: 3px solid ${ACCENT}; background: ${ACCENT}0d; font-size: 12px; line-height: 1.6; border-radius: 0 8px 8px 0; }

  .part-header { display:flex; align-items:flex-start; gap: 16px; margin-bottom: 30px; padding-bottom: 22px; border-bottom: 1px solid ${INK_LINE}; }
  .part-icon { flex-shrink:0; width:44px; height:44px; border-radius:12px; background:${PAPER_DIM}; display:flex; align-items:center; justify-content:center; }
  .part-title { font-size: 24px; font-weight: 800; margin: 2px 0 6px; letter-spacing:-0.01em; }
  .part-sub { font-size: 12px; color: ${MIST}; line-height:1.5; margin:0; max-width:440px; }

  .step { display: flex; gap: 18px; margin-bottom: 26px; page-break-inside: avoid; }
  .step-num { font-family: "Courier New", monospace; font-size: 12px; font-weight: 800; color: ${PAPER}; background:${ACCENT}; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-body { flex: 1; padding-top: 1px; }
  h3 { font-size: 14.5px; font-weight: 800; margin: 0 0 7px; letter-spacing: -0.005em; }
  p { font-size: 11.5px; line-height: 1.6; margin: 0 0 6px; color: ${TEXT}; }
  ul { margin: 8px 0 0; padding-left: 17px; }
  li { font-size: 11.5px; line-height: 1.55; margin-bottom: 5px; color: ${TEXT}; }
  .box { margin-top: 10px; padding: 10px 14px; border-radius: 8px; font-size: 10.5px; line-height: 1.6; }
  .box-label { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .box.tip { background: ${PAPER_DIM}; color: #3a352e; }
  .box.tip .box-label { color: ${MIST}; }
  .box.warn { background: ${ACCENT}12; color: #5c1020; border: 1px solid ${ACCENT}40; }
  .box.warn .box-label { color: ${ACCENT}; }

  .mock { border: 1px solid #ddd; border-radius: 10px; overflow: hidden; margin: 10px 0 4px; box-shadow: 0 10px 26px -16px rgba(0,0,0,.35); }
  .mock-bar { display:flex; align-items:center; gap:5px; padding:7px 10px; background:#ececea; border-bottom:1px solid #dcdcda; }
  .mock-dot { width:7px;height:7px;border-radius:50%; background:#cfcfcd; }
  .mock-url { margin-left:6px; font-family: "Courier New", monospace; font-size: 10px; color:#444; background:white; border-radius:5px; padding:3px 9px; border:1px solid #ddd; }
  a.inline-link { color: inherit; text-decoration: none; }
  p a.inline-link, li a.inline-link { color: ${ACCENT}; font-weight: 700; text-decoration: underline; text-decoration-color: ${ACCENT}66; text-decoration-thickness: 1px; }
  .mock-body { padding: 14px 14px; background: #fafaf9; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .mock-btn { display:inline-block; background: ${ACCENT}; color:white; font-weight:700; font-size:10.5px; padding:7px 14px; border-radius:18px; }
  .mock-point { font-size: 10px; font-weight:700; color: ${ACCENT}; display:flex; align-items:center; }
  .tri { display:inline-block; width:0;height:0; border-top:4px solid transparent; border-bottom:4px solid transparent; border-right:6px solid ${ACCENT}; margin-right:5px; }

  .check-grid { margin-top: 22px; }
  .check-item { display:flex; gap: 12px; align-items:flex-start; padding: 11px 0; border-bottom: 1px solid ${INK_LINE}; font-size: 12px; line-height:1.5; }
  .check-box { flex-shrink:0; width:16px; height:16px; border:1.6px solid ${ACCENT}; border-radius:4px; margin-top:1px; }

  .glossary-item { padding: 13px 0; border-bottom: 1px solid ${INK_LINE}; }
  .glossary-term { font-weight: 800; font-size: 12.5px; color: ${ACCENT}; margin-bottom:3px; }
  .glossary-def { font-size: 11.5px; line-height: 1.55; color: ${TEXT}; margin:0; }

  .contact-page { background:${INK}; color:${PAPER}; padding: 70px 55px; min-height: 297mm; display:flex; flex-direction:column; justify-content:center; }
  .contact-page h2 { font-size: 30px; font-weight:800; max-width: 420px; line-height:1.2; margin:0 0 16px; }
  .contact-page p { color:#cfcfcf; font-size:13px; line-height:1.6; max-width:420px; margin:0 0 34px; }
  .contact-row { display:flex; gap:10px; align-items:baseline; margin-bottom: 10px; }
  .contact-label { font-family:"Courier New",monospace; font-weight:800; color:${ACCENT}; font-size:12px; }
  .contact-value { font-size: 13px; color:${PAPER}; }

  /* position:fixed in paged/print media repeats the element on every
     printed page — the one reliable way to get a running footer here
     (flex margin-top:auto inside a forced page-break box did not size
     correctly under Chromium's print fragmentation). */
  footer.pf { position: fixed; bottom: 18px; left: 55px; right: 55px; padding-top: 12px; border-top: 1px solid ${INK_LINE}; color: ${MIST}; font-size: 9px; display: flex; justify-content: space-between; }
</style></head><body>

  <footer class="pf"><span>Lyon AI Studio — lyonaistudio@gmail.com</span><span>lyonaistudio.fr</span></footer>

  <div class="cover">
    <div class="brand"><div class="mark">L</div><div class="brand-name">Lyon AI Studio</div></div>
    <div class="eyebrow">Guide débutant — SEO &amp; Google Ads</div>
    <h1 class="cover-title">Être visible sur Google, étape par étape</h1>
    <p class="cover-sub">Le guide pour faire connaître votre site sans jargon : le référencement naturel gratuit (SEO), la fiche Google Business Profile, et Google Ads pour aller plus vite — chaque clic expliqué.</p>
    <div class="stats">
      <div><div class="stat-num">3</div><div class="stat-label">Parties</div></div>
      <div><div class="stat-num">20</div><div class="stat-label">Étapes</div></div>
      <div><div class="stat-num">0 €</div><div class="stat-label">Pour le SEO</div></div>
    </div>
    <div class="cover-footer"><span>Généré le ${today}</span><span>Guide client — Lyon AI Studio</span></div>
  </div>

  <div class="page">
    ${partHeader("bulb", "Pour commencer", "Deux façons d'apparaître sur Google", "Il ne s'agit pas de choisir l'une ou l'autre : les deux se complètent, et ce guide couvre les deux dans l'ordre où s'en occuper.")}
    <div class="intro-cols">
      <div class="intro-col free">
        <h3>Référencement naturel (SEO)</h3>
        <p>Gratuit. Résultats qui prennent du temps à s'installer (plusieurs semaines à quelques mois), mais qui durent — même sans y penser tous les jours une fois en place.</p>
      </div>
      <div class="intro-col paid">
        <h3>Google Ads (payant)</h3>
        <p>Vous payez à chaque clic sur votre annonce. Résultats immédiats, mais qui s'arrêtent dès que vous arrêtez de payer.</p>
      </div>
    </div>
    <div class="intro-note">La bonne approche : lancer le SEO en premier (partie 1 de ce guide) car c'est gratuit et durable, puis utiliser Google Ads (partie 2) pour accélérer pendant que le SEO monte en puissance.</div>

    ${partHeader("seo", "Partie 1 — Gratuit", "Être trouvé sans payer (SEO)", "Google Search Console pour l'indexation technique, puis la fiche Google Business Profile — souvent le levier le plus rentable pour une activité locale.")}
    ${SEO_STEPS.slice(0, 4).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("pin", "Partie 1 — suite", "La fiche Google Business Profile", "")}
    ${SEO_STEPS.slice(4).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("ads", "Partie 2 — Payant", "Aller plus vite avec Google Ads", "À utiliser une fois la partie 1 lancée — ou en parallèle si vous êtes pressé. On ne paie que si quelqu'un clique sur l'annonce.")}
    ${ADS_STEPS.slice(0, 3).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("ads", "Partie 2 — suite", "Rédiger, lancer, suivre", "")}
    ${ADS_STEPS.slice(3).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("bulb", "Partie 3 — Pour aller plus loin", "Suivre, écrire, être cité partout", "Ce qui distingue un site bien référencé d'un site très bien référencé — à traiter une fois les parties 1 et 2 en place.")}
    ${MORE_STEPS.slice(0, 3).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("bulb", "Partie 3 — suite", "Technique et réseaux sociaux", "")}
    ${MORE_STEPS.slice(3).map(stepHtml).join("")}
  </div>

  <div class="page">
    ${partHeader("check", "Récapitulatif", "Votre checklist complète", "À cocher au fur et à mesure — l'ordre suit celui du guide.")}
    <div class="check-grid">
      ${CHECKLIST.map((c) => `<div class="check-item"><span class="check-box"></span><span>${c}</span></div>`).join("")}
    </div>
  </div>

  <div class="page">
    ${partHeader("book", "Pour s'y retrouver", "Petit glossaire", "Les quelques mots qui reviennent tout le temps, expliqués simplement.")}
    ${GLOSSARY.map(([term, def]) => `<div class="glossary-item"><div class="glossary-term">${term}</div><p class="glossary-def">${def}</p></div>`).join("")}
  </div>

  <div class="contact-page">
    <div class="eyebrow">Une étape pas claire ?</div>
    <h2>On peut s'en occuper avec vous, ou à votre place.</h2>
    <p>La création de la fiche Google Business Profile, l'envoi du sitemap ou le lancement d'une première campagne Google Ads peuvent aussi être pris en charge directement par Lyon AI Studio.</p>
    <div class="contact-row"><span class="contact-label">E.</span><span class="contact-value">lyonaistudio@gmail.com</span></div>
    <div class="contact-row"><span class="contact-label">W.</span><span class="contact-value">lyonaistudio.fr</span></div>
  </div>

</body></html>`;

const tmpHtml = "/tmp/guide-seo-google-render.html";
writeFileSync(tmpHtml, html, "utf-8");

execFileSync(CHROME, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--print-to-pdf=${OUT}`,
  "--no-pdf-header-footer",
  "--virtual-time-budget=3000",
  `file://${tmpHtml}`,
]);

console.log("PDF écrit dans", OUT);
