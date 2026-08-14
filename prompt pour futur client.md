# Brief type — Site client Lyon AI Studio

Ce document sert de base pour créer un nouveau site client. **Tout le système
(structure technique, automatisations, sécurité, emails) doit être répliqué à
l'identique.** Seul le design (couleurs, typographies, imagerie, ton des
textes, métaphores visuelles) doit être adapté au secteur d'activité du
client.

À remplir avant de démarrer :
- Nom de l'entreprise cliente :
- Secteur d'activité :
- Ville / zone de chalandise :
- Coordonnées (email, téléphone, horaires) :
- Palette de marque si déjà existante (sinon en proposer une adaptée au secteur) :
- Identité du client sur Make.com (nouveau compte ou compte existant) :
- Nom de domaine prévu :

**Règle à appliquer dès le début du projet** : demander en une seule fois,
au tout début, toutes les informations et accès liés au compte mail du
client et à ses comptes Google (adresse Gmail à connecter, création du
bot Telegram + son token, clé API Google Places si prospection prévue,
accès au registrar pour le domaine, création de la Google Sheet de suivi
avec ses colonnes). Ne pas attendre d'en avoir besoin au fil du build
pour les demander une par une — ça ralentit énormément la mise en place
(vécu sur le projet précédent). Lister toutes ces demandes dans un seul
message groupé avant de commencer la partie automatisation.

---

## 1. Site (Astro + Tailwind CSS v4)

- Stack identique : Astro (statique), Tailwind v4 avec tokens `@theme`,
  `astro:transitions` (`ClientRouter`) pour les transitions de page,
  Content Collections pour le blog.
- Pages : Accueil, Services (page détail par service), À propos,
  Déroulement (étapes de collaboration), Actualités/Blog, FAQ, Contact,
  Mentions légales.
- Effets/interactions à reprendre : curseur magnétique personnalisé,
  scramble text sur les eyebrows, reveal-on-scroll, léger grain overlay,
  bandeau de stats chiffrées, diagramme de workflow illustrant le service
  phare, hover cards avec élévation.
- **SEO** : JSON-LD `LocalBusiness`, sitemap (`@astrojs/sitemap`),
  `robots.txt`, images OG générées via `sharp` (favicons, cover blog,
  image de vitrine Google Business Profile).
- **Design à adapter** : palette de couleurs, typographies (via
  `@fontsource`), ton de la rédaction, métaphores visuelles (illustrations,
  diagrammes) — tout doit correspondre au secteur du client, en évitant
  les designs "template IA" génériques (pas de dégradés violet/bleu
  cliché sauf si le secteur s'y prête vraiment).

## 2. Formulaire de contact

- Formspree pour la réception principale, en mode **AJAX** (`fetch` avec
  `Accept: application/json`), jamais de redirection `_next` (ne fonctionne
  pas de manière fiable) — gérer succès/erreur entièrement côté client
  avec des bannières stylées au thème du site.
- Champ honeypot `_gotcha` anti-spam.
- **Important** : les noms de champs envoyés en parallèle au webhook Make
  (voir section 3) ne doivent jamais contenir d'espace ou d'apostrophe
  (`TypeEntreprise` pas `Type d'entreprise`) — les formules Make cassent
  sinon. Formspree, lui, peut garder les noms de champs normaux/accentués.

## 3. Automatisation Make.com — traitement des demandes

Scénario déclenché par un **Custom Webhook** (`gateway:CustomWebHook`)
appelé en parallèle de Formspree depuis le JS du formulaire (fire-and-forget,
`keepalive: true`, ne bloque jamais l'UX si Make est indisponible).

Chaîne : **Webhook → Email de réponse auto (Gmail) → Notification
Telegram → Journal Google Sheets**.

- **Email auto-réponse** (`google-email:sendAnEmail`, version 4) :
  texte **fixe** (pas d'IA — voir "Leçon importante" ci-dessous), personnalisé
  avec le prénom du client, confirmant la réception et annonçant un retour
  sous 24h. Champ `to` = tableau simple `["{{1.Email}}"]` (pas d'objet
  imbriqué), `bodyType: "rawHtml"`, remplacer les retours à la ligne par
  `<br>` via `replace()`.
- **Notification Telegram** (`telegram:SendReplyMessage`, version 1) :
  message court au propriétaire ("Nouvelle demande reçue de X, réponse
  auto envoyée"). Connexion = bot Telegram créé via @BotFather (le
  propriétaire doit lui envoyer un message une fois avant le premier test,
  sinon erreur "chat not found"). Chat ID récupéré via @userinfobot.
- **Google Sheets** (`google-sheets:addRow`, version 2) : journal des
  demandes (Date, Prénom, Nom, Email, Type d'entreprise, Secteur, Message,
  Statut) pour permettre les relances manuelles. Colonnes à mettre en
  "Renvoyer à la ligne" (wrap text) sinon l'affichage se chevauche, et
  format de la colonne Date en "Date" (sinon Sheets affiche le numéro de
  série brut).

**Sécurité** :
- Réduire `maximum_runs_per_minute` du scénario (10 suffit largement pour
  un formulaire de contact) pour limiter l'impact d'un abus du webhook
  (l'URL du webhook est visible dans le code source de la page, c'est
  inévitable pour un site sans serveur — limiter les dégâts possibles
  plutôt que chercher à cacher l'URL).
- Ne jamais committer les clés API / tokens dans le repo Git — toujours
  utiliser un dossier local exclu via `.gitignore` (voir section 6).

## 4. Automatisation Make.com — prospection (optionnel, sur demande)

Scénario séparé, déclenché **chaque jour à heure fixe** (`scheduling:
{"type":"daily","time":"08:00"}`).

Chaîne : **HTTP (Google Places API New) → Iterator → Filtre "sans site
web" → Google Sheets**.

- Recherche via `POST https://places.googleapis.com/v1/places:searchText`
  avec headers `X-Goog-Api-Key` et `X-Goog-FieldMask`
  (`places.displayName,places.formattedAddress,places.websiteUri,
  places.nationalPhoneNumber,places.id`).
- **Nécessite d'activer "Places API (New)"** dans Google Cloud Console
  (pas seulement l'ancienne "Places API", qui renvoie une erreur
  `REQUEST_DENIED` sur les nouveaux projets).
- Catégorie de recherche qui tourne automatiquement (liste large de
  commerces locaux pertinents pour le secteur du client, formule
  `switch()` sur un index calculé par date).
- Rayon de recherche géographique centré sur une zone de départ, qui
  grandit automatiquement chaque jour (`locationBias.circle`, PAS
  `locationRestriction` qui n'accepte pas de cercle, seulement un
  rectangle).
- Filtre : ne garder que les résultats sans `websiteUri`. **Point non
  résolu dans le projet précédent** : les opérateurs de filtre standards
  (`notexist`, `empty`) ne fonctionnent pas de façon fiable sur des champs
  dynamiquement absents issus d'un module HTTP générique + Iterator — le
  configurer directement dans l'éditeur visuel Make (icône filtre sur la
  connexion) plutôt que par API pour ce cas précis.

## 5. Supports imprimés et vidéo (sur demande du client)

- Génération programmatique (Node + `sharp`) de flyers et cartes de
  visite recto/verso (versions avec et sans fond perdu pour l'impression
  pro), avec QR code vers le site.
- Vidéo de présentation : pipeline Playwright + Motion (animations CSS
  pilotées frame par frame) + ffmpeg, voix off française via Piper TTS
  (voix homme "tom" ou femme "siwis" selon préférence client), musique de
  fond générée procéduralement (aucun risque de droits).
- Fiche Google Business Profile : catégorie adaptée, description
  orientée conversion, image de couverture et logo carré générés en
  cohérence avec la charte du site.

## 6. Déploiement et sécurité

- Repo GitHub + GitHub Actions → GitHub Pages, domaine personnalisé avec
  HTTPS auto-provisionné (certificat Let's Encrypt géré par GitHub —
  si le certificat ne se déclenche pas après un moment, retirer puis
  remettre le CNAME force la reprovision).
- `.gitignore` : exclure tout dossier contenant des clés API locales
  (ex. `cle api/`) **avant** de faire le premier `git add` — vérifier
  l'historique complet (`git log --all -p | grep ...`) qu'aucun secret
  n'a fuité si le repo existait déjà avant cette vérification.
- Jamais de mot de passe de compte transmis — uniquement des tokens API
  à portée limitée, utilisés le temps de la configuration puis dont la
  révocation est conseillée au client une fois le système en place.

## 7. Leçon importante — ne pas utiliser l'IA pour générer le texte de l'email auto-réponse

Le module OpenAI natif de Make (`openai-gpt-3:CreateCompletion`) tronque
les réponses de façon non résolue (le réglage `max_tokens` n'a aucun
effet, confirmé après de nombreux tests). Un contournement via le module
HTTP générique vers l'API Chat Completions d'OpenAI est possible
(`http:MakeRequest`, voir noms de modules ci-dessous) mais complexe à
configurer par API sans l'éditeur visuel. **Recommandation : partir
directement sur un texte fixe personnalisé** (comme décrit en section 3),
plus simple, gratuit, et 100% fiable. Ne proposer l'IA que si le client
insiste, et dans ce cas prévoir plus de temps et idéalement laisser le
client configurer le module HTTP dans l'éditeur visuel Make (l'éditeur
remplit automatiquement les champs techniques cachés qui bloquent sinon).

## Annexe technique — noms exacts des modules Make (évite de deviner à l'aveugle)

Ces identifiants sont globaux à Make (pas propres à un compte), donc
réutilisables tels quels :

| Fonction | Module | Version |
|---|---|---|
| Webhook personnalisé | `gateway:CustomWebHook` | 1 |
| Envoyer un email (Gmail) | `google-email:sendAnEmail` | 4 |
| Envoyer un message Telegram | `telegram:SendReplyMessage` | 1 |
| Ajouter une ligne Google Sheets | `google-sheets:addRow` | 2 |
| Requête HTTP générique | `http:MakeRequest` | 4 |
| Iterator (découper un tableau) | `builtin:BasicFeeder` | 1 |

Clé de connexion générique pour tous les modules : `__IMTCONN__`
(identifiant numérique de la connexion, dans `parameters`).

**Méthode qui marche à chaque fois pour découvrir un module inconnu** :
demander au client (ou faire soi-même si accès à l'interface) d'ajouter
le module dans l'éditeur visuel Make et de cliquer OK, même sans tout
remplir correctement — puis relire le blueprint via l'API
(`GET /scenarios/{id}/blueprint`) : Make y attache automatiquement le nom
exact du module, sa version, et le schéma complet des champs attendus
(objet `metadata.expect`). Ne jamais deviner un nom de module tiers à
l'aveugle sans ce filet de sécurité — ça coûte beaucoup de temps en
essais-erreurs.
