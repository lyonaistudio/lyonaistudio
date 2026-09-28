// Typographie française appliquée au HTML final (après `astro build`) :
// espace fine insécable avant ? ! ; — insécable avant : et à l'intérieur des
// guillemets « » — « 48h » → « 48 h ». Seul le texte visible est touché :
// balises, attributs, <script>, <style>, <pre>, <code> et <textarea> sont laissés tels quels.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const NNBSP = " "; // espace fine insécable
const NBSP = " "; // espace insécable
const SKIP = /^<(script|style|pre|code|textarea)\b/i;

// Les entités HTML (&amp; &#39; …) finissent par « ; » : on les isole pour
// ne jamais y insérer d'espace.
function fixText(t) {
  return t
    .split(/(&#?\w+;)/)
    .map((part, i) => (i % 2 === 1 ? part : fixPlain(part)))
    .join("");
}

function fixPlain(t) {
  return t
    .replace(/[  ]+([?!;])/g, `${NNBSP}$1`)
    .replace(/([\p{L}\p{N})»%€])([?!;])(?=\s|$|<)/gu, `$1${NNBSP}$2`)
    .replace(/[  ]+:(?=\s|$)/g, `${NBSP}:`)
    .replace(/«[  ]*/g, `«${NBSP}`)
    .replace(/[  ]*»/g, `${NBSP}»`)
    .replace(/\b(\d{1,3})h\b/g, `$1${NBSP}h`);
}

export function fixHtml(html) {
  // Découpe en : blocs à ignorer | balises | texte.
  const parts = html.split(/(<(?:script|style|pre|code|textarea)\b[\s\S]*?<\/(?:script|style|pre|code|textarea)>|<[^>]*>)/i);
  return parts.map((p, i) => (i % 2 === 1 || SKIP.test(p) ? p : fixText(p))).join("");
}

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

export default function typographieFr() {
  return {
    name: "typographie-fr",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        let n = 0;
        for await (const f of htmlFiles(fileURLToPath(dir))) {
          const src = await readFile(f, "utf8");
          const out = fixHtml(src);
          if (out !== src) { await writeFile(f, out); n++; }
        }
        logger.info(`typographie française appliquée à ${n} pages`);
      },
    },
  };
}
