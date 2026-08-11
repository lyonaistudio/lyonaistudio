import { readFileSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";

const fonts = JSON.parse(readFileSync("fonts-base64.json", "utf8"));
const shots = JSON.parse(readFileSync("site-images.json", "utf8"));
const timeline = JSON.parse(readFileSync("voice-timeline.json", "utf8"));
const beat = Object.fromEntries(timeline.map((b) => [b.id, b]));

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

function wipeText(id, text, cls) {
  return `<div class="wipe-wrap" id="wrap-${id}"><span class="${cls}">${text}</span><div class="wipe-mask" id="mask-${id}"></div></div>`;
}

function logoMark(size, letterSize) {
  return `<div class="logo-mark" style="width:${size}px;height:${size}px;border-radius:${size * 0.16}px;"><span style="font-size:${letterSize}px;">L</span></div>`;
}

function subtitleBar(id, text) {
  return `<div class="subtitle" id="sub-${id}">${text}</div>`;
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
  .grain-overlay {
    position: absolute; inset: 0; z-index: 40; pointer-events: none;
    opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .vignette {
    position: absolute; inset: 0; z-index: 39; pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.22) 100%);
  }

  .logo-mark { background: var(--ink); border: 2px solid var(--ink-line); display: flex; align-items: center; justify-content: center; }
  .logo-mark span { font-family: "Space Grotesk"; font-weight: 700; color: var(--accent); }

  .panel { position: absolute; inset: 0; }

  .header { position: absolute; top: 64px; left: 64px; display: flex; align-items: center; gap: 22px; opacity: 0; z-index: 20; }
  .header .word { font-family: "Space Grotesk"; font-weight: 700; font-size: 42px; color: var(--paper); }

  .wipe-wrap { position: relative; display: inline-block; overflow: hidden; }
  .wipe-mask { position: absolute; inset: 0; background: var(--ink); }

  .pad { position: absolute; top: 300px; left: 64px; right: 64px; }
  .center-col { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 64px; }
  .eyebrow { font-family: "JetBrains Mono"; font-weight: 500; font-size: 30px; letter-spacing: 3px; color: var(--accent); opacity: 0; text-transform: uppercase; }
  .headline-big { font-family: "Space Grotesk"; font-weight: 700; font-size: 78px; line-height: 1.14; color: var(--paper); }
  .headline-med { font-family: "Space Grotesk"; font-weight: 700; font-size: 62px; line-height: 1.2; color: var(--paper); }

  /* ---- Search mockup (hook1) ---- */
  .search-mock { width: 820px; opacity: 0; }
  .search-bar { display: flex; align-items: center; gap: 18px; background: var(--ink-soft); border: 2px solid var(--ink-line); border-radius: 40px; padding: 26px 34px; }
  .search-bar .dot { width: 20px; height: 20px; border-radius: 50%; border: 3px solid var(--accent); flex-shrink: 0; }
  .search-typed { font-family: "Inter"; font-size: 34px; color: var(--paper); white-space: nowrap; overflow: hidden; border-right: 3px solid var(--accent); width: 0; }
  .result-row { margin-top: 26px; height: 22px; background: var(--ink-soft); border-radius: 4px; opacity: 0; }
  .result-row.w1 { width: 60%; } .result-row.w2 { width: 85%; } .result-row.w3 { width: 45%; }

  /* ---- Empty state (hook2) ---- */
  .empty-browser { width: 760px; border: 2px solid var(--ink-line); border-radius: 14px; overflow: hidden; opacity: 0; }
  .empty-browser .bar { display: flex; gap: 10px; background: var(--ink-soft); padding: 16px 22px; }
  .empty-browser .bar span { width: 14px; height: 14px; border-radius: 50%; background: var(--ink-line); }
  .empty-browser .body { height: 340px; display: flex; align-items: center; justify-content: center; background: var(--ink); }
  .empty-browser .body .q { font-family: "Space Grotesk"; font-size: 120px; color: var(--ink-line); }
  .invisible-tag { margin-top: 40px; font-family: "JetBrains Mono"; font-size: 30px; letter-spacing: 2px; color: var(--accent); opacity: 0; text-transform: uppercase; }

  /* ---- Product mockup ---- */
  .mockup-wrap { position: absolute; inset: 0; }
  .laptop { position: absolute; top: 50%; left: 50%; width: 900px; margin-left: -450px; margin-top: -320px; opacity: 0; }
  .laptop-topbar { display: flex; align-items: center; gap: 10px; background: var(--ink-soft); border: 2px solid var(--ink-line); border-bottom: none; border-radius: 14px 14px 0 0; padding: 16px 22px; }
  .laptop-topbar .dot { width: 16px; height: 16px; border-radius: 50%; }
  .laptop-topbar .dot.r { background: #a34a3c; } .laptop-topbar .dot.y { background: #b8934a; } .laptop-topbar .dot.g { background: #5c8a5c; }
  .laptop-topbar .url { margin-left: 20px; font-family: "JetBrains Mono"; font-size: 22px; color: var(--mist); background: var(--ink); padding: 6px 18px; border-radius: 6px; }
  .laptop-screen { width: 900px; height: 620px; overflow: hidden; border: 2px solid var(--ink-line); border-top: none; border-radius: 0 0 14px 14px; background: var(--ink); }
  .laptop-screen img { width: 900px; display: block; will-change: transform; }

  /* ---- Workflow diagram ---- */
  .diagram-wrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .flow-line { stroke-dasharray: 6 6; animation: flow-dash 1.4s linear infinite; }
  @keyframes flow-dash { to { stroke-dashoffset: -24; } }

  /* ---- Single-line contact metaphor (recap2) ---- */
  .link-wrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

  .accent-bar { width: 90px; height: 6px; background: var(--accent); }

  /* ---- Outro ---- */
  .outro-brand { display: flex; align-items: center; gap: 24px; opacity: 0; }
  .outro-brand .word { font-family: "Space Grotesk"; font-weight: 700; font-size: 64px; color: var(--paper); }
  .outro-tag { font-family: "Inter"; font-weight: 500; font-size: 34px; color: var(--mist); margin-top: 22px; opacity: 0; }
  .outro-contact { margin-top: 44px; display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0; }
  .outro-contact .row { font-family: "JetBrains Mono"; font-size: 32px; color: var(--paper-dim); display: flex; gap: 14px; }
  .outro-contact .row .lab { color: var(--accent); font-weight: 700; }
  .outro-cta { margin-top: 50px; display: flex; flex-direction: column; align-items: center; gap: 24px; opacity: 0; }
  .cta-btn { font-family: "Inter"; font-weight: 600; font-size: 36px; color: var(--ink); background: var(--accent); padding: 22px 44px; border-radius: 8px; text-align: center; }
  .outro-qr { margin-top: 18px; opacity: 0; }
  .outro-qr img { width: 220px; height: 220px; display: block; }
  .outro-qr .cap { font-family: "JetBrains Mono"; font-size: 24px; color: var(--mist); text-align: center; margin-top: 14px; }

  .end-fade { position: absolute; inset: 0; background: var(--ink); opacity: 0; pointer-events: none; z-index: 50; }

  /* ---- Subtitles ---- */
  .subtitle-wrap { position: absolute; left: 64px; right: 64px; bottom: 130px; z-index: 45; text-align: center; }
  .subtitle {
    display: none; font-family: "Inter"; font-weight: 600; font-size: 34px; line-height: 1.4; color: var(--paper);
    background: rgba(18, 17, 16, 0.72); border-radius: 10px; padding: 18px 28px; opacity: 0;
  }
  .subtitle.is-active { display: inline-block; }
</style>
</head>
<body>
  <div class="stage">
    <div class="grid-bg"></div>

    <div class="header">
      ${logoMark(64, 34)}
      <div class="word">Lyon AI Studio</div>
    </div>

    <!-- hook1 : recherche Google -->
    <div class="panel" id="p-hook1">
      <div class="center-col">
        <div class="eyebrow" style="margin-bottom: 40px;">// Aujourd'hui</div>
        <div class="search-mock">
          <div class="search-bar">
            <div class="dot"></div>
            <div class="search-typed" id="search-typed">plombier lyon</div>
          </div>
          <div class="result-row w1"></div>
          <div class="result-row w2"></div>
          <div class="result-row w3"></div>
        </div>
      </div>
    </div>

    <!-- hook2 : invisible -->
    <div class="panel" id="p-hook2">
      <div class="center-col">
        <div class="empty-browser">
          <div class="bar"><span></span><span></span><span></span></div>
          <div class="body"><div class="q">?</div></div>
        </div>
        <div class="invisible-tag">Invisible sur Google</div>
      </div>
    </div>

    <!-- value1 : mockup du site -->
    <div class="panel" id="p-value">
      <div class="pad" style="top:120px;">
        <div class="eyebrow">// Un vrai site, pas une maquette</div>
      </div>
      <div class="mockup-wrap">
        <div class="laptop" id="mockup-laptop">
          <div class="laptop-topbar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="url">Exemple de réalisation</span>
          </div>
          <div class="laptop-screen"><img id="shot-desktop" src="data:image/jpeg;base64,${shots.desktop}" /></div>
        </div>
      </div>
    </div>

    <!-- bridge -->
    <div class="panel" id="p-bridge">
      <div class="center-col">
        <div class="logo-mark" id="bridge-logo" style="width:120px;height:120px;border-radius:20px;opacity:0;"><span style="font-size:64px;">L</span></div>
      </div>
    </div>

    <!-- ai1 : diagramme workflow -->
    <div class="panel" id="p-ai">
      <div class="pad" style="top:150px;">
        <div class="eyebrow">// L'agent IA, concrètement</div>
      </div>
      <div class="diagram-wrap">
        <svg viewBox="0 0 900 420" width="880" height="411">
          <g stroke="var(--accent)" stroke-width="1.5" fill="none" opacity="0.55">
            <path class="flow-line" d="M170,80 C280,80 300,180 420,200" />
            <path class="flow-line" d="M170,210 C280,210 300,205 420,210" />
            <path class="flow-line" d="M170,340 C280,340 300,240 420,220" />
            <path class="flow-line" d="M480,200 C600,180 620,90 730,80" />
            <path class="flow-line" d="M480,210 C600,210 620,210 730,210" />
            <path class="flow-line" d="M480,220 C600,240 620,330 730,340" />
          </g>
          <g font-family="Inter, sans-serif" font-size="17" fill="var(--paper-dim)">
            <rect x="20" y="55" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="95" y="86" text-anchor="middle">Message client</text>
            <rect x="20" y="185" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="95" y="216" text-anchor="middle">Email</text>
            <rect x="20" y="315" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="95" y="346" text-anchor="middle">Demande de RDV</text>
          </g>
          <g>
            <circle cx="450" cy="210" r="60" fill="var(--ink)" stroke="var(--accent)" stroke-width="2" />
            <text x="450" y="203" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1" fill="var(--accent)">AGENT</text>
            <text x="450" y="223" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1" fill="var(--accent)">IA</text>
          </g>
          <g font-family="Inter, sans-serif" font-size="17" fill="var(--paper-dim)">
            <rect x="730" y="55" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="805" y="86" text-anchor="middle">Réponse envoyée</text>
            <rect x="730" y="185" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="805" y="216" text-anchor="middle">RDV programmé</text>
            <rect x="730" y="315" width="150" height="50" rx="6" fill="var(--ink-soft)" stroke="var(--ink-line)" />
            <text x="805" y="346" text-anchor="middle">Client relancé</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- recap1 : phrase choc -->
    <div class="panel" id="p-recap1">
      <div class="center-col">
        <div class="headline-big">
          ${wipeText("r1a", "Un site qui vous représente.", "recap-line")}<br/>
          ${wipeText("r1b", "Des outils qui travaillent", "recap-line")}<br/>
          ${wipeText("r1c", "à votre place.", "recap-line")}
        </div>
      </div>
    </div>

    <!-- recap2 : interlocuteur unique -->
    <div class="panel" id="p-recap2">
      <div class="link-wrap">
        <svg viewBox="0 0 700 200" width="680" height="194">
          <line x1="120" y1="100" x2="580" y2="100" stroke="var(--accent)" stroke-width="2" class="flow-line" opacity="0.6"/>
          <circle cx="120" cy="100" r="16" fill="var(--ink)" stroke="var(--paper-dim)" stroke-width="2"/>
          <text x="120" y="150" text-anchor="middle" font-family="JetBrains Mono" font-size="20" fill="var(--paper-dim)">VOUS</text>
          <circle cx="580" cy="100" r="16" fill="var(--ink)" stroke="var(--accent)" stroke-width="2"/>
          <text x="580" y="150" text-anchor="middle" font-family="JetBrains Mono" font-size="20" fill="var(--accent)">LYON AI STUDIO</text>
        </svg>
      </div>
    </div>

    <!-- cta : outro -->
    <div class="panel" id="p-outro">
      <div class="center-col">
        <div class="outro-brand">
          ${logoMark(90, 50)}
          <div class="word">Lyon AI Studio</div>
        </div>
        <div class="outro-tag">Sites internet &amp; automatisation IA</div>
        <div class="outro-contact">
          <div class="row"><span class="lab">T.</span><span>07 76 62 42 15</span></div>
          <div class="row"><span class="lab">E.</span><span>lyoniastudio@gmail.com</span></div>
        </div>
        <div class="outro-cta">
          <div class="accent-bar"></div>
          <div class="cta-btn">Demande de renseignements sans engagement</div>
        </div>
        <div class="outro-qr">
          <img src="data:image/png;base64,${qrBase64}" />
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
console.log("video.html written. Total narration:", timeline[timeline.length - 1].start + timeline[timeline.length - 1].duration);
