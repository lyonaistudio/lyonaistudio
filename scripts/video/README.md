# Génération de la vidéo publicitaire (v3 — style spot TV, premium)

Pipeline : page HTML animée (bibliothèque `motion`, structurée en "panels" plein écran, grain +
vignette pour coller au design du site) → capture image par image déterministe (Playwright +
scrubbing du temps d'animation, 30 fps, 1080×1920) → bande sonore composée (rythme + basse + arpège +
whooshs/dings/montée de tension) → assemblage MP4 (ffmpeg/libx264).

Le fichier final est copié à deux endroits : `publicité/video-pub-instagram-tiktok.mp4` (support
marketing) et `public/videos/lyon-ai-studio-presentation.mp4` (intégré sur le site, page d'accueil,
section "En vidéo").

Outils installés localement dans ce dossier (`node_modules` propre à `scripts/video/`, séparé du
projet Astro principal) : `motion`, `playwright`, `esbuild`, `qrcode`.

## Structure de la vidéo (34.5 s)

Chaque scène est un "panel" plein écran qui glisse depuis le bas, reste, puis glisse vers le haut
pour laisser place au suivant (au lieu de simples fondus — c'est ce qui donne l'impression de montage
dynamique plutôt que de diaporama) :

1. **Accroche** (0–1,5 s) : notifications qui s'accumulent puis se rassemblent en un point — amorce le
   problème avant la marque.
2. **Logo** (1,5–4,6 s) : révélation du nom en effet "wipe" (masque qui glisse), pas un simple fondu.
3. **Proposition de valeur** (4,6–9,6 s) : titre en typographie cinétique (wipe ligne par ligne).
4. **Le vrai produit** (9,6–15,6 s) : mockup navigateur + téléphone avec de vraies captures du site,
   qui défilent (effet de scroll simulé).
5. **Services** (15,6–21,6 s) : les deux services, icônes + listes qui glissent alternativement.
6. **Démo agent IA** (21,6–25,1 s) : simulation de conversation (message client → réponse automatique).
7. **Déroulement** (25,1–29,1 s) : les 4 étapes, barres qui claquent en alternance gauche/droite.
8. **Fin / CTA** (29,1–34,5 s) : coordonnées, bouton CTA qui pulse, QR code avec ligne de scan.

## Regénérer la vidéo

```sh
cd scripts/video
npm install                                   # si node_modules absent
npx playwright install --with-deps chromium    # si Chromium absent (~200 Mo)

# Recapturer les visuels du vrai site (nécessite que le site tourne sur :4321)
node capture-site.mjs
node -e '/* voir historique du projet pour le script de resize + encodage base64 */'

node make-html.mjs                             # régénère video.html (polices, screenshots, QR intégrés)
npx esbuild video.mjs --bundle --format=esm --outfile=video.bundle.js

python3 -m http.server 8977 &                  # requis : modules ES bloqués en file://
node capture.mjs                               # capture 1035 images dans frames/ (~3-9 min)

node audio/synth.mjs                           # régénère audio/score.wav (musique) si besoin
# puis remixer score + SFX -> audio/full-mix-v2.wav (voir commande ffmpeg dans la section Bande sonore)

ffmpeg -framerate 30 -i frames/frame_%04d.png -i audio/full-mix-v2.wav \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 17 -preset medium \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  publicite-video.mp4

cp publicite-video.mp4 "../../publicité/video-pub-instagram-tiktok.mp4"
cp publicite-video.mp4 "../../public/videos/lyon-ai-studio-presentation.mp4"
ffmpeg -y -ss 3.5 -i publicite-video.mp4 -frames:v 1 -q:v 3 "../../public/videos/poster.jpg"
rm -rf frames  # ménage : 1035 PNG, plusieurs dizaines de Mo
```

## ⚠️ Piège important : `animate()` doit être mis en pause

Motion (`animate()`) démarre la lecture en temps réel dès sa création, comme un `<video autoplay>`.
Si on ne fait QUE scruber via `.time` sans jamais appeler `.pause()`, les animations continuent de
dériver en arrière-plan pendant toute la capture (plusieurs minutes) et corrompent le rendu de
manière difficile à repérer (éléments visibles trop tôt, à une opacité intermédiaire inattendue).
`video.mjs` appelle `controls.forEach(c => c.pause())` juste après avoir enregistré toutes les
animations, avant d'exposer `window.__setTime` — **ne pas retirer cet appel**.

## Modifier le contenu / timing

- `make-html.mjs` : structure HTML/CSS de chaque panel (couleurs, polices, textes, mockups).
- `video.mjs` : timing de chaque animation, en secondes. Fonctions utiles :
  - `fadeIn` / `fadeOut` : une seule transition, l'élément garde son état final indéfiniment après.
  - `fadeInOut` : entrée ET sortie en un seul appel `animate()` (évite les conflits d'ordre de
    composition WAAPI quand deux animations ciblent la même propriété du même élément).
  - `wipeReveal` : révélation en "wipe" d'un texte enveloppé par `wipeText()` côté HTML.
  - `grow` / `moveVanish` : effets d'apparition/disparition avec échelle (utilisés pour l'accroche).
  - `panY` : défilement simulé d'une capture d'écran dans un mockup.

## Bande sonore

`audio/synth.mjs` génère `audio/score.wav` : un vrai petit morceau composé en code (pas juste une
nappe) — progression d'accords F-C-Dm-Bb, ligne de basse, arpège 16ᵉ en dents de scie, batterie
programmée (kick/hi-hat/clap), avec une automation d'énergie par section (`energyAt(t)`) qui suit le
montage : quasi silence sur l'accroche, groove complet sur les sections produit/étapes, retrait
pendant la démo de chat pour laisser le "ding" respirer. Mastering final (soft-clip + fades) inclus.

`audio/whoosh.wav`, `tick.wav`, `ding.wav`, `riser.wav` : effets ponctuels (ffmpeg `lavfi`), placés aux
instants clés via `adelay` puis mixés par-dessus le score avec `amix` dans `audio/full-mix-v2.wav`
(voir la commande complète dans l'historique du projet, ou reconstruire par étapes similaires).

100% généré par synthèse — aucune piste ni sample existant réutilisé, aucun risque de droits d'auteur.
