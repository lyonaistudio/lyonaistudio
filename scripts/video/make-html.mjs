import { readFileSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";

const fonts = JSON.parse(readFileSync("fonts-base64.json", "utf8"));
const shots = JSON.parse(readFileSync("site-images.json", "utf8"));

const qrBuf = await QRCode.toBuffer("https://lyonaistudio.fr", {
  errorCorrectionLevel: "M",
  margin: 0,
  color: { dark: "#121110", light: "#f4f1ea" },
  width: 400,
});
const qrBase64 = qrBuf.toString("base64");

function fontFace(family, weight, base64) {
  return `
  @font-face {
    font-family: "${family}";
    font-style: normal;
    font-weight: ${weight};
    src: url(data:font/woff2;base64,${base64}) format("woff2");
    font-display: block;
  }`;
}

function esc(s) {
  return s;
}

// A text block whose reveal is a mask-wipe (overlay slides off to reveal the text),
// far more "broadcast" than a plain opacity fade. `id` must be unique.
function wipeText(id, text, cls) {
  return `<div class="wipe-wrap" id="wrap-${id}"><span class="${cls}">${text}</span><div class="wipe-mask" id="mask-${id}"></div></div>`;
}

function logoMark(size, letterSize) {
  return `<div class="logo-mark" style="width:${size}px;height:${size}px;border-radius:${size * 0.16}px;"><span style="font-size:${letterSize}px;">L</span></div>`;
}

function bullets(items) {
  return items.map((t) => `<div class="bullet"><span class="dot"></span><span>${t}</span></div>`).join("\n");
}

function nodeMotifSmall() {
  const nodes = [[10, 10], [70, 0], [90, 40], [50, 55], [0, 45]];
  const pairs = [[0,1],[1,2],[2,3],[3,0],[3,4],[4,0]];
  let svg = `<svg viewBox="0 0 100 60" width="72" height="44">`;
  pairs.forEach(([a,b]) => {
    svg += `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="#e2672c" stroke-width="2.5"/>`;
  });
  nodes.forEach(([x,y]) => { svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="#e2672c"/>`; });
  svg += `</svg>`;
  return svg;
}

function browserIconSmall() {
  return `<svg viewBox="0 0 100 70" width="80" height="56">
    <rect x="2" y="2" width="96" height="66" rx="6" fill="none" stroke="#e2672c" stroke-width="3"/>
    <line x1="2" y1="20" x2="98" y2="20" stroke="#e2672c" stroke-width="3"/>
    <circle cx="12" cy="11" r="3" fill="#e2672c"/>
    <circle cx="24" cy="11" r="3" fill="#e2672c"/>
  </svg>`;
}

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  ${fontFace("Space Grotesk", 500, fonts.spaceGrotesk500)}
  ${fontFace("Space Grotesk", 600, fonts.spaceGrotesk600)}
  ${fontFace("Space Grotesk", 700, fonts.spaceGrotesk700)}
  ${fontFace("Inter", 400, fonts.inter400)}
  ${fontFace("Inter", 500, fonts.inter500)}
  ${fontFace("Inter", 600, fonts.inter600)}
  ${fontFace("JetBrains Mono", 400, fonts.jbMono400)}
  ${fontFace("JetBrains Mono", 500, fonts.jbMono500)}
  ${fontFace("JetBrains Mono", 700, fonts.jbMono700)}

  :root {
    --ink: #121110; --ink-soft: #1a1815; --ink-line: #2b2721;
    --paper: #f4f1ea; --paper-dim: #d9d4c8; --mist: #93897a;
    --accent: #e2672c; --accent-soft: #f0a06f;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; background: var(--ink); overflow: hidden; }
  body { font-family: "Inter", sans-serif; }
  .stage { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
  .grid-bg {
    position: absolute; inset: -60px; will-change: transform;
    background-image: linear-gradient(var(--ink-line) 1px, transparent 1px), linear-gradient(90deg, var(--ink-line) 1px, transparent 1px);
    background-size: 60px 60px; opacity: 0.5;
  }

  .logo-mark { background: var(--ink); border: 2px solid var(--ink-line); display: flex; align-items: center; justify-content: center; }
  .logo-mark span { font-family: "Space Grotesk"; font-weight: 700; color: var(--accent); }

  .panel { position: absolute; inset: 0; }

  /* ---------- Header (persistent) ---------- */
  .header { position: absolute; top: 64px; left: 64px; display: flex; align-items: center; gap: 22px; opacity: 0; z-index: 20; }
  .header .word { font-family: "Space Grotesk"; font-weight: 700; font-size: 42px; color: var(--paper); }

  /* ---------- Hook panel ---------- */
  .hook-pill { position: absolute; background: var(--ink-soft); border: 1px solid var(--ink-line); padding: 18px 28px; border-radius: 10px; font-family: "Inter"; font-weight: 500; font-size: 30px; color: var(--paper-dim); opacity: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .hook-dot { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; background: var(--accent); border-radius: 10px; opacity: 0; }

  /* ---------- Wipe-reveal text ---------- */
  .wipe-wrap { position: relative; display: inline-block; overflow: hidden; }
  .wipe-mask { position: absolute; inset: 0; background: var(--ink); }

  .intro-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; height: 100%; }
  .intro-logo { opacity: 0; }
  .intro-word { font-family: "Space Grotesk"; font-weight: 700; font-size: 92px; color: var(--paper); }
  .intro-tag { font-family: "JetBrains Mono"; font-weight: 500; font-size: 32px; letter-spacing: 3px; color: var(--accent); opacity: 0; text-transform: uppercase; }
  .intro-underline { width: 0; height: 5px; background: var(--accent); }

  /* ---------- Generic content padding ---------- */
  .pad { position: absolute; top: 280px; left: 64px; right: 64px; }
  .eyebrow { font-family: "JetBrains Mono"; font-weight: 500; font-size: 30px; letter-spacing: 3px; color: var(--accent); opacity: 0; text-transform: uppercase; }
  .headline-big { font-family: "Space Grotesk"; font-weight: 700; font-size: 76px; line-height: 1.14; color: var(--paper); margin-top: 28px; }
  .headline2 { font-family: "Space Grotesk"; font-weight: 700; font-size: 56px; line-height: 1.2; color: var(--paper); }
  .subtext { font-family: "Inter"; font-weight: 500; font-size: 38px; line-height: 1.5; color: var(--paper-dim); margin-top: 48px; opacity: 0; }

  /* ---------- Product mockups ---------- */
  .mockup-wrap { position: absolute; inset: 0; }
  .laptop { position: absolute; top: 50%; left: 50%; width: 900px; margin-left: -450px; margin-top: -320px; opacity: 0; }
  .laptop-topbar { display: flex; align-items: center; gap: 10px; background: var(--ink-soft); border: 2px solid var(--ink-line); border-bottom: none; border-radius: 14px 14px 0 0; padding: 16px 22px; }
  .laptop-topbar .dot { width: 16px; height: 16px; border-radius: 50%; }
  .laptop-topbar .dot.r { background: #a34a3c; } .laptop-topbar .dot.y { background: #b8934a; } .laptop-topbar .dot.g { background: #5c8a5c; }
  .laptop-topbar .url { margin-left: 20px; font-family: "JetBrains Mono"; font-size: 22px; color: var(--mist); background: var(--ink); padding: 6px 18px; border-radius: 6px; }
  .laptop-screen { width: 900px; height: 560px; overflow: hidden; border: 2px solid var(--ink-line); border-top: none; border-radius: 0 0 14px 14px; background: var(--ink); }
  .laptop-screen img { width: 900px; display: block; will-change: transform; }

  .phone { position: absolute; top: 50%; left: 50%; width: 420px; margin-left: -210px; margin-top: -430px; opacity: 0; }
  .phone-frame { border: 10px solid var(--ink-soft); outline: 2px solid var(--ink-line); border-radius: 46px; overflow: hidden; width: 420px; height: 860px; position: relative; background: var(--ink); }
  .phone-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 160px; height: 26px; background: var(--ink-soft); border-radius: 0 0 16px 16px; z-index: 5; }
  .phone-frame img { width: 420px; display: block; will-change: transform; }

  /* ---------- Services ---------- */
  .service-card { position: absolute; top: 290px; left: 0; right: 0; opacity: 0; }
  .service-card .icon-row { display: flex; align-items: center; gap: 28px; }
  .service-card .idx { font-family: "JetBrains Mono"; font-weight: 700; font-size: 32px; color: var(--accent); }
  .service-card .title { font-family: "Space Grotesk"; font-weight: 700; font-size: 58px; color: var(--paper); margin-top: 20px; }
  .service-card .bullets { margin-top: 36px; display: flex; flex-direction: column; gap: 22px; }
  .bullet { display: flex; align-items: center; gap: 18px; font-family: "Inter"; font-weight: 400; font-size: 36px; color: var(--paper-dim); opacity: 0; }
  .bullet .dot { width: 12px; height: 12px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }
  .accent-bar { width: 90px; height: 6px; background: var(--accent); }

  /* ---------- Chat demo ---------- */
  .chat-phone { position: absolute; top: 50%; left: 50%; width: 460px; margin-left: -230px; margin-top: -390px; }
  .chat-frame { border: 10px solid var(--ink-soft); outline: 2px solid var(--ink-line); border-radius: 46px; width: 460px; height: 780px; padding: 90px 26px 26px; display: flex; flex-direction: column; gap: 20px; justify-content: flex-end; background: var(--ink); }
  .chat-bubble { border-radius: 18px; padding: 20px 24px; font-family: "Inter"; font-size: 28px; line-height: 1.4; opacity: 0; max-width: 88%; }
  .chat-bubble.in { align-self: flex-start; background: var(--ink-line); color: var(--paper-dim); border-bottom-left-radius: 4px; }
  .chat-bubble.out { align-self: flex-end; background: var(--accent); color: var(--ink); border-bottom-right-radius: 4px; font-weight: 600; }
  .chat-badge { align-self: flex-end; font-family: "JetBrains Mono"; font-size: 20px; color: var(--accent); opacity: 0; letter-spacing: 2px; }

  /* ---------- Steps ---------- */
  .step-row { position: absolute; left: 0; right: 0; display: flex; align-items: center; gap: 40px; padding: 28px 40px; background: var(--ink-soft); border: 1px solid var(--ink-line); opacity: 0; }
  .step-row .num { font-family: "Space Grotesk"; font-weight: 700; font-size: 60px; color: var(--accent); width: 100px; }
  .step-row .label { font-family: "Space Grotesk"; font-weight: 600; font-size: 44px; color: var(--paper); }

  /* ---------- Outro ---------- */
  .outro-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
  .outro-brand { display: flex; align-items: center; gap: 24px; opacity: 0; }
  .outro-brand .word { font-family: "Space Grotesk"; font-weight: 700; font-size: 64px; color: var(--paper); }
  .outro-tag { font-family: "Inter"; font-weight: 500; font-size: 34px; color: var(--mist); margin-top: 22px; opacity: 0; }
  .outro-contact { margin-top: 44px; display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0; }
  .outro-contact .row { font-family: "JetBrains Mono"; font-size: 32px; color: var(--paper-dim); display: flex; gap: 14px; }
  .outro-contact .row .lab { color: var(--accent); font-weight: 700; }
  .outro-cta { margin-top: 50px; display: flex; flex-direction: column; align-items: center; gap: 24px; opacity: 0; }
  .cta-btn { font-family: "Inter"; font-weight: 600; font-size: 36px; color: var(--ink); background: var(--accent); padding: 22px 44px; border-radius: 8px; text-align: center; }
  .outro-qr { margin-top: 18px; opacity: 0; position: relative; }
  .outro-qr img { width: 220px; height: 220px; display: block; }
  .outro-qr .cap { font-family: "JetBrains Mono"; font-size: 24px; color: var(--mist); text-align: center; margin-top: 14px; }
  .qr-scan { position: absolute; left: 0; right: 0; height: 4px; background: var(--accent); opacity: 0.85; box-shadow: 0 0 16px 2px var(--accent); }

  .end-fade { position: absolute; inset: 0; background: var(--ink); opacity: 0; pointer-events: none; z-index: 50; }

  .grain-overlay {
    position: absolute; inset: 0; z-index: 40; pointer-events: none;
    opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .vignette {
    position: absolute; inset: 0; z-index: 39; pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.22) 100%);
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="grid-bg"></div>

    <div class="header">
      ${logoMark(64, 34)}
      <div class="word">Lyon AI Studio</div>
    </div>

    <!-- P0 : hook -->
    <div class="panel" id="p-hook">
      <div class="hook-pill" style="top:360px;left:90px;">Nouveau message client</div>
      <div class="hook-pill" style="top:860px;left:600px;">Appel manqué</div>
      <div class="hook-pill" style="top:1360px;left:140px;">3 devis en attente</div>
      <div class="hook-dot"></div>
    </div>

    <!-- P1 : logo intro -->
    <div class="panel" id="p-intro">
      <div class="intro-panel">
        <div class="intro-logo">${logoMark(160, 90)}</div>
        ${wipeText("intro-word", "Lyon AI Studio", "intro-word")}
        <div class="intro-tag">Sites internet &amp; automatisation IA</div>
        <div class="intro-underline" id="intro-underline"></div>
      </div>
    </div>

    <!-- P2 : value proposition -->
    <div class="panel" id="p-value">
      <div class="pad">
        <div class="eyebrow">// Lyon — sites web &amp; automatisation IA</div>
        <div class="headline-big">
          ${wipeText("h1", "Votre site,", "hl-line")}<br/>
          ${wipeText("h2", "vos tâches", "hl-line")}<br/>
          ${wipeText("h3", "automatisées.", "hl-line")}
        </div>
        <div class="subtext" id="value-sub">
          Création de sites internet et automatisation par IA pour les artisans,
          commerces et PME de la région lyonnaise.
        </div>
      </div>
    </div>

    <!-- P3 : product mockups -->
    <div class="panel" id="p-product">
      <div class="pad" style="top:120px;">
        <div class="eyebrow">// Un vrai site, pas une maquette</div>
      </div>
      <div class="mockup-wrap">
        <div class="laptop" id="mockup-laptop">
          <div class="laptop-topbar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="url">lyonaistudio.fr</span>
          </div>
          <div class="laptop-screen"><img id="shot-desktop" src="data:image/jpeg;base64,${shots.desktop}" /></div>
        </div>
        <div class="phone" id="mockup-phone">
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <img id="shot-mobile" src="data:image/jpeg;base64,${shots.mobile}" />
          </div>
        </div>
      </div>
    </div>

    <!-- P4 : services -->
    <div class="panel" id="p-services">
      <div class="pad">
        <div class="eyebrow">// Ce qu'on fait</div>
        <div class="headline2" style="margin-top:24px;">Deux services, un seul objectif :<br/>vous faire gagner du temps.</div>

        <div class="service-card" id="s1">
          <div class="icon-row">${browserIconSmall()}<div><div class="idx">01</div><div class="title">Création de site internet</div></div></div>
          <div class="bullets">
            ${bullets(["Design sur-mesure, pas de template générique", "Optimisé pour le référencement local", "Impeccable sur mobile"])}
          </div>
        </div>

        <div class="service-card" id="s2">
          <div class="icon-row">${nodeMotifSmall()}<div><div class="idx">02</div><div class="title">Automatisation / agent IA</div></div></div>
          <div class="bullets">
            ${bullets(["Réponses, prise de rendez-vous, relances", "Adapté à votre métier, pas générique", "Vous gardez la main sur l'essentiel"])}
          </div>
        </div>
      </div>
    </div>

    <!-- P5 : chat demo -->
    <div class="panel" id="p-chat">
      <div class="pad" style="top:160px;">
        <div class="eyebrow">// L'agent IA en action</div>
      </div>
      <div class="mockup-wrap">
        <div class="chat-phone">
          <div class="chat-frame">
            <div class="chat-bubble in" id="chat-in">Bonjour, vous êtes dispo pour un devis cette semaine ?</div>
            <div class="chat-badge" id="chat-badge">RÉPONSE AUTOMATIQUE — 2 SEC</div>
            <div class="chat-bubble out" id="chat-out">Bonjour ! Oui, je peux vous proposer un créneau jeudi ou vendredi. Je vous envoie les disponibilités.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- P6 : steps -->
    <div class="panel" id="p-steps">
      <div class="pad">
        <div class="eyebrow">// Comment ça se passe</div>
        <div class="step-row" id="step1" style="top:150px;"><div class="num">01</div><div class="label">Contact</div></div>
        <div class="step-row" id="step2" style="top:280px;"><div class="num">02</div><div class="label">Échange</div></div>
        <div class="step-row" id="step3" style="top:410px;"><div class="num">03</div><div class="label">Proposition</div></div>
        <div class="step-row" id="step4" style="top:540px;"><div class="num">04</div><div class="label">Réalisation</div></div>
      </div>
    </div>

    <!-- P7 : outro -->
    <div class="panel" id="p-outro">
      <div class="outro-panel">
        <div class="outro-brand">
          ${logoMark(90, 50)}
          <div class="word">Lyon AI Studio</div>
        </div>
        <div class="outro-tag">Sites internet &amp; automatisation IA</div>
        <div class="outro-contact">
          <div class="row"><span class="lab">T.</span><span>07 76 62 42 15</span></div>
          <div class="row"><span class="lab">E.</span><span>lyonaistudio@gmail.com</span></div>
        </div>
        <div class="outro-cta">
          <div class="cta-btn">Demande de renseignements sans engagement</div>
        </div>
        <div class="outro-qr">
          <img src="data:image/png;base64,${qrBase64}" />
          <div class="qr-scan" id="qr-scan"></div>
          <div class="cap">lyonaistudio.fr</div>
        </div>
      </div>
    </div>

    <div class="vignette"></div>
    <div class="grain-overlay"></div>
    <div class="end-fade"></div>
  </div>

  <script type="module" src="video.bundle.js"></script>
</body>
</html>
`;

writeFileSync("video.html", html);
console.log("video.html written");
