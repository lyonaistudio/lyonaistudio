# Supports publicitaires — Lyon AI Studio

Fichiers prêts à l'emploi (impression + vidéo), générés dans l'identité visuelle du site.

## Vidéo publicitaire

`video-pub-instagram-tiktok.mp4` — 34,5 secondes, format vertical 1080×1920 (9:16), pour Instagram/TikTok
Reels, Stories Facebook. Montage façon spot publicitaire : accroche, révélation de marque, mockups du
vrai site (navigateur + mobile), démo concrète de l'agent IA (conversation client), les 4 étapes du
déroulement, puis coordonnées + QR code. Transitions en glissement plein écran et typographie animée
en "wipe" (pas de simples fondus). Grain et vignette pour rester cohérent avec le nouveau design du site.

**Bande sonore v3** : composition originale avec rythme (kick/hi-hat), ligne de basse et arpège
mélodique sur une progression d'accords F-C-Dm-Bb, avec automation de volume par scène (silence sur
l'accroche, plein régime sur les sections produit, retrait pendant la démo de chat) — plus les effets
"whoosh"/notification/montée de tension déjà en place. 100% synthétisée par code (`scripts/video/audio/synth.mjs`),
aucune piste existante réutilisée, donc aucun risque de droits d'auteur.

Cette vidéo est aussi intégrée directement sur le site (page d'accueil, section "En vidéo", mockup
téléphone cliquable) via `public/videos/lyon-ai-studio-presentation.mp4`.

Regénérer/modifier : voir `scripts/video/README.md`.

## Fichiers imprimés

| Fichier | Format | Usage |
| --- | --- | --- |
| `carte-visite-recto.png` / `carte-visite-verso.png` | 85 × 55 mm, sans fond perdu | À utiliser si Vistaprint vous demande le **format fini** |
| `carte-visite-recto-fond-perdu.png` / `-verso-...` | 91 × 61 mm, avec 3 mm de fond perdu sur chaque bord | À utiliser si Vistaprint vous demande un fichier **avec fond perdu** ("bleed") |
| `flyer-recto.png` / `flyer-verso.png` | A5 — 148 × 210 mm, sans fond perdu | Format fini |
| `flyer-recto-fond-perdu.png` / `-verso-...` | 154 × 216 mm, avec 3 mm de fond perdu | Avec fond perdu |

**Comment savoir lequel choisir ?** Sur Vistaprint, en amont de l'upload, l'outil indique la taille attendue pour le produit choisi (carte de visite standard 85×55 mm, flyer A5). Si l'écran d'upload ne mentionne pas de fond perdu, utilisez les fichiers **sans** "fond-perdu". S'il demande explicitement un fichier avec bords perdus/bleed, utilisez la version "fond-perdu" — l'outil recadrera automatiquement les 3 mm de marge sur chaque bord.

Tous les fichiers sont en 300 DPI (résolution standard impression professionnelle), donc la netteté est garantie quel que soit le format choisi.

## Contenu

- **Carte de visite** : recto = identité de marque (logo, nom, positionnement) ; verso = coordonnées de contact (Thomas Batisse).
- **Flyer A5** : recto = accroche + présentation ; verso = détail des deux services, déroulement en 4 étapes, coordonnées et QR code vers le site (`https://lyonaistudio.github.io`).

## Regénérer ou modifier

Les fichiers sont générés par des scripts dans `scripts/print/` (Node.js + `sharp` + `qrcode`, déjà installés dans le projet). Pour modifier un texte ou une couleur, éditez le script correspondant puis relancez :

```sh
node scripts/print/business-card.mjs
node scripts/print/flyer.mjs
```

Les fichiers sont régénérés dans ce dossier `publicité/`.

## À vérifier avant d'imprimer

- Le numéro de téléphone, l'email et le nom sont corrects (déjà vérifiés avec les informations fournies).
- Le lien du QR code (`lyonaistudio.github.io`) ne fonctionnera pleinement qu'une fois le site déployé sur GitHub Pages (voir le `README.md` principal du projet).
- Si un nom de domaine personnalisé est acheté plus tard (ex. `lyonaistudio.fr`), pensez à régénérer ces fichiers avec la nouvelle adresse.
