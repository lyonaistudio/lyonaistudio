# Lyon AI Studio — site internet

Site statique Astro + Tailwind CSS pour Lyon AI Studio, prêt à être déployé sur GitHub Pages.

## Commandes

| Commande          | Action                                        |
| :----------------- | :--------------------------------------------- |
| `npm install`       | Installe les dépendances                       |
| `npm run dev`       | Lance le serveur local sur `localhost:4321`    |
| `npm run build`     | Build le site statique dans `./dist/`          |
| `npm run preview`   | Prévisualise le build en local                 |

## Déploiement sur GitHub Pages

Le dépôt n'est pas encore poussé sur GitHub — le code a été généré en local uniquement. Étapes pour mettre le site en ligne :

1. Créer le dépôt GitHub `lyonaistudio.github.io` (dépôt de page utilisateur/organisation).
2. Ajouter le remote et pousser la branche `main` :
   ```sh
   git remote add origin https://github.com/<votre-compte>/lyonaistudio.github.io.git
   git branch -M main
   git push -u origin main
   ```
3. Dans les paramètres du dépôt GitHub → **Pages**, choisir la source **GitHub Actions** (le workflow `.github/workflows/deploy.yml` build et déploie automatiquement à chaque push sur `main`).
4. Le site sera disponible à `https://lyonaistudio.github.io`.

## À compléter avant mise en ligne

- **Formspree** : créer un compte sur [formspree.io](https://formspree.io), créer un formulaire, puis remplacer `YOUR_FORMSPREE_ID` dans `src/lib/site.ts` (`FORMSPREE_ENDPOINT`) par l'endpoint réel. Configurer l'adresse email de destination directement dans le tableau de bord Formspree.
- **SIRET** : remplacer `[SIRET EN ATTENTE]` dans `src/pages/mentions-legales.astro` une fois le numéro obtenu.
- **Réseaux sociaux** : ajouter les liens dans `SITE.sameAs` (`src/lib/site.ts`) une fois les profils créés (LinkedIn, etc.), pour enrichir les données structurées `LocalBusiness`.

## Checklist SEO — actions hors code, après livraison

- [ ] Créer et valider la fiche **Google Business Profile** avec les mêmes informations NAP (nom, adresse/zone, téléphone) que le site : Lyon AI Studio, Lyon, 07 76 62 42 15.
- [ ] Connecter **Google Search Console** au domaine et soumettre le sitemap : `https://lyonaistudio.github.io/sitemap-index.xml`.
- [ ] Collecter des **avis clients Google** au fil des missions, puis connecter le widget d'avis sur la page Contact (emplacement déjà réservé).
- [ ] Obtenir des **liens externes** : annuaires locaux lyonnais, partenaires, profil LinkedIn actif.
- [ ] Publier régulièrement de nouveaux articles dans **Actualités** (`src/content/blog/`) en dupliquant un fichier `.md` existant comme modèle.

## Supports imprimés & vidéo

Carte de visite, flyer A5 recto-verso (Vistaprint) et vidéo publicitaire verticale (Instagram/TikTok)
dans `publicité/` (voir `publicité/LISEZ-MOI.md`), générés dans la même identité visuelle que le site.
La vidéo est aussi intégrée directement sur la page d'accueil (section "En vidéo", mockup téléphone
cliquable) via `public/videos/`.

## Structure du projet

```
src/
├── content/blog/       # Articles de blog (Markdown)
├── components/         # Composants réutilisables (Header, Footer, cartes, FAQ…)
├── layouts/             # BaseLayout (SEO, JSON-LD, header/footer)
├── lib/                 # Constantes (NAP, nav) et helpers Schema.org
├── pages/                # Routes du site
└── styles/global.css    # Design system Tailwind v4 (palette, typographie)
scripts/                  # Scripts de génération des visuels (OG image, favicons, covers de blog)
```

## Design

Palette resserrée graphite chaud (`ink`) / papier (`paper`) / accent cuivre (`accent`), définie dans
`src/styles/global.css` via `@theme`. Typographies auto-hébergées (Space Grotesk pour les titres, Inter
pour le texte courant, JetBrains Mono pour les détails techniques), sans dépendance à Google Fonts.
