# Reviix

Reviix est une application de révision pour lycéens/étudiants : elle transforme
des notes de cours (texte, photos, PDF, Word) en fiches de révision
structurées, génère un planning de révision par répétition espacée à partir
des examens à venir, et propose un quiz par chapitre pour se tester.

## Stack

- **Frontend** : Next.js 16 (App Router, React 19, Turbopack), Tailwind CSS v4
- **Auth + base de données** : Supabase (Postgres + Auth par e-mail/mot de
  passe, sans OAuth ; e-mail vérifié par lien de confirmation à
  l'inscription)
- **IA** : Anthropic (Claude), uniquement depuis des Route Handlers côté
  serveur
- **Paiement** : Whop (3 abonnements mensuels récurrents à paliers de
  crédits — 9,99 € / 19,99 € / 39,99 €, aucun paiement ponctuel)
- **Hébergement cible** : Vercel

## Mise en route

### 1. Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner :

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ANTHROPIC_API_KEY=
WHOP_API_KEY=
WHOP_WEBHOOK_SECRET=
WHOP_PLAN_ID_TIER1=
WHOP_PLAN_ID_TIER2=
WHOP_PLAN_ID_TIER3=
WHOP_ACCOUNT_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SECRET_KEY` et `ANTHROPIC_API_KEY` ne doivent **jamais** être
exposées côté client : elles ne sont lues que dans des Route Handlers /
modules serveur (marqués `import "server-only"`).

### 2. Configuration Supabase (dashboard)

- **Auth → Providers → Email** : activé, avec **"Confirm email"** coché (pour
  que l'inscription exige bien un clic de confirmation avant de pouvoir se
  connecter par mot de passe).
- **Auth → URL Configuration → Redirect URLs** : ajouter
  `http://localhost:3000/auth/callback` et l'équivalent en production
  (`https://ton-domaine/auth/callback`).
- Le mail de confirmation utilise le template "Confirm signup" par défaut de
  Supabase (aucun template personnalisé requis) et repose sur PKCE : le lien
  doit être ouvert dans le **même navigateur** que celui qui a fait
  l'inscription. Une fois l'e-mail confirmé, les connexions suivantes se
  font directement par e-mail + mot de passe (`signInWithPassword`), sans
  nouveau lien à envoyer.

### 3. Migrations SQL

Les migrations vivent dans `supabase/migrations/` :

- `0001_init.sql` : schéma complet (profiles, subjects, chapters, fiches,
  exams, exam_chapters, planning_tasks, quizzes, quiz_attempts,
  subscriptions), RLS `auth.uid() = user_id` sur chaque table, trigger
  `handle_new_user` qui crée la ligne `profiles` à l'inscription.
- `0002_ai_lock.sql` : table `ai_lock` + fonctions `try_acquire_ai_lock` /
  `release_ai_lock`, un verrou global qui sérialisait tous les appels à
  Claude — supprimé par `0012_drop_ai_lock.sql` une fois la génération de
  fiches parallélisée (voir plus bas).
- `0003_fiche_drafts.sql` : table `fiche_drafts`, stockage temporaire entre
  la génération d'une fiche et son assignation matière/chapitre — voir
  "Flux d'enregistrement d'une fiche" plus bas.

Appliquer avec la CLI Supabase :

```bash
supabase link --project-ref <ton-project-ref>
supabase db push
```

(ou coller le contenu des deux fichiers dans l'éditeur SQL du dashboard, dans
l'ordre.)

### 4. Installation et lancement

```bash
npm install
npm run dev
```

L'application est servie sur `http://localhost:3000`.

### 5. Whop (optionnel en local)

Whop n'a pas d'équivalent de la Stripe CLI pour relayer les webhooks vers
`localhost`. Pour tester en local, exposer le serveur de dev via un tunnel
(ex. `ngrok http 3000`) et configurer l'URL publique obtenue comme endpoint
webhook (`https://<tunnel>/api/whop/webhook`) dans le dashboard Whop, avec
au minimum les événements `membership.activated`, `membership.deactivated`
et `payment.succeeded`.

Sans webhook configuré, un paiement Whop ne mettra jamais à jour la table
`subscriptions` — l'abonnement ne passera donc jamais à `active` en local.

**Mode sandbox** : `WHOP_SANDBOX=true` fait basculer `lib/whop/client.ts`
vers `https://sandbox-api.whop.com/api/v1` et vers les variables
`WHOP_API_KEY_SANDBOX`/`WHOP_WEBHOOK_SECRET_SANDBOX`/
`WHOP_PLAN_ID_TIER1_SANDBOX`/`WHOP_PLAN_ID_TIER2_SANDBOX`/
`WHOP_PLAN_ID_TIER3_SANDBOX`/`WHOP_ACCOUNT_ID_SANDBOX` au lieu des
variables de production — permet de
tester un paiement complet avec de fausses cartes sans jamais toucher aux
identifiants ni à l'argent réel. Le webhook ne vérifie qu'un seul secret à
la fois selon ce réglage : un événement sandbox est rejeté tant que
`WHOP_SANDBOX=false`, et inversement — sandbox et production se testent
l'un après l'autre, jamais simultanément. Remettre `WHOP_SANDBOX=false` (ou
la retirer) repasse en production sans toucher au reste du code.

## Architecture — modules métier clés

### `lib/anthropic/client.ts` — appel Claude avec validation stricte

`generateJson()` encapsule l'appel à l'API Messages de Claude (modèle
`claude-opus-5`) et exige une réponse JSON strictement valide. Une réponse
peut être un succès HTTP (200) tout en étant vide ou tronquée
(`stop_reason === "max_tokens"`) — dans les deux cas, comme en cas de JSON
invalide ou de structure incomplète (le paramètre `validate` fourni par
l'appelant), la fonction relance automatiquement l'appel (jusqu'à 3
tentatives) avant d'abandonner avec une erreur explicite.

Le system prompt (identique à chaque appel pour un même `label`) est envoyé
avec `cache_control: { type: "ephemeral" }`, pour que les appels fiche/quiz
qui se suivent ou tournent en parallèle le lisent en cache plutôt que de le
repayer au prix plein.

**Pas de verrou global** : jusqu'à récemment, tous les appels à Claude
passaient par un verrou applicatif (`lib/anthropic/lock.ts`, table
`ai_lock` — voir `0002_ai_lock.sql` / `0012_drop_ai_lock.sql`) qui
empêchait structurellement deux générations de tourner en même temps. Ce
verrou a été supprimé une fois la génération de fiches volontairement
parallélisée (plusieurs chunks d'un même upload envoyés en même temps
depuis `creation-flow.tsx`, voir plus bas) : il se contentait de remettre
ces appels parallèles en file d'attente et de faire échouer ceux qui
restaient coincés trop longtemps derrière les autres. Rien d'autre ne
dépendait de cette sérialisation (le coût d'usage est enregistré via un
incrément SQL atomique, indépendant du verrou), donc plusieurs appels à
Claude peuvent désormais tourner simultanément, pour un même utilisateur
comme entre utilisateurs différents.

### `lib/anthropic/prompts.ts` — prompts fiches & quiz

- Génération de fiche : sortie JSON stricte (plan numéroté en continu,
  sous-points lettrés, section "À retenir"), fidèle aux sources fournies.
- Génération de quiz : le modèle renvoie une bonne réponse et 3 distracteurs
  séparément (`reponseCorrecte` / `distracteurs`) ; **`shuffleQuizQuestions`
  mélange ensuite ce tableau côté serveur** pour déterminer la position
  finale de la bonne réponse — la position n'est donc jamais seulement
  "demandée" au modèle, elle est réellement randomisée après coup.

### `lib/quiz/schedule.ts` + `lib/quiz/get-or-generate.ts` — préparation des quiz

Dès qu'une fiche est enregistrée (`POST /api/fiches`), `scheduleQuizPreparation`
marque immédiatement les 3 quiz de difficulté du chapitre comme `pending`,
puis utilise `after()` (Next.js) pour lancer leur génération une fois la
réponse HTTP envoyée — l'enregistrement d'une fiche n'attend donc jamais 3
appels IA séquentiels. Ces 3 générations restent malgré tout strictement
séquentielles entre elles (et avec toute génération de fiche concurrente)
grâce au verrou global. Quand l'utilisateur ouvre un quiz,
`getOrGenerateQuiz` sert le quiz déjà prêt instantanément s'il est à jour
(comparaison de `source_fiches_updated_at`), patiente brièvement si une
génération en tâche de fond est en cours, et sinon la déclenche à la demande.

### `lib/planning/scheduler.ts` — planning multi-examens par répétition espacée

Fonction pure (`generatePlanning`) : pour chaque examen, planifie une passe
"découverte" par chapitre (mutualisée si plusieurs examens couvrent le même
chapitre) puis plusieurs passes "rappel" réparties entre la découverte et la
date d'examen (leur nombre dépend de l'importance). Les tâches candidates
sont ensuite réparties sur les vrais jours de révision (déduits du rythme
hebdomadaire choisi par l'utilisateur) en respectant le budget de minutes/jour,
triées par priorité (urgence = jours restants, pondérée par l'importance) ;
ce qui déborde un jour est reporté au prochain jour de révision disponible,
jamais après la date de l'examen concerné. `lib/planning/build-plan.ts`
fait le pont entre cette fonction pure et les données réelles (examens,
chapitres, contenu des fiches, réglages du profil).

### `lib/subscription/constants.ts` + `lib/subscription/gate.ts` + `lib/subscription/preview.ts` — modèle économique

3 abonnements mensuels **récurrents** au choix (`TIERS` dans
`lib/subscription/constants.ts`), aucun paiement ponctuel :

| Tier    | Prix       | Crédits/mois | Fiches | Quiz | Planning |
| ------- | ---------- | ------------ | ------ | ---- | -------- |
| `tier1` | 9,99 €     | 1500         | ✅     | ❌   | ❌       |
| `tier2` | 19,99 €    | 4000         | ✅     | ✅   | ✅       |
| `tier3` | 39,99 €    | 9000         | ✅     | ✅   | ✅       |

- La génération de fiches est **gratuite et illimitée** pour un non-abonné.
- La **lecture** (et donc l'enregistrement) est réservée aux abonnés actifs,
  quel que soit le tier : `POST /api/fiches` renvoie 402 sinon. L'accès au
  quiz et au planning dépend en plus du tier — `hasFeatureAccess`/
  `subscriptionHasFeature` gardent `/api/quiz/[chapterId]`,
  `/api/planning/generate` et les pages `(app)/quiz/chapitre/[chapterId]` +
  `(app)/planning` (`components/abonnement/feature-locked.tsx` remplace le
  contenu par un écran "fonctionnalité verrouillée" pour un abonné `tier1`).
  `POST /api/fiches` ne planifie pas non plus la préparation des quiz en
  tâche de fond (`scheduleQuizPreparation`) pour un `tier1` — inutile de
  dépenser son budget sur des quiz qu'il ne peut pas voir.
- Chaque tier convertit son nombre de crédits en un budget de coût réel des
  appels Claude (fiches + quiz confondus, calculé à partir de
  `response.usage` — voir `lib/anthropic/client.ts`) via un taux de
  conversion interne fixe (`TierConfig.budgetUsd`) — jamais affiché, les
  crédits sont la seule unité montrée à l'utilisateur (aucun montant en euro
  n'accompagne jamais un nombre de crédits dans l'UI). Le budget est
  vérifié/décompté à chaque appel de génération (pas à l'enregistrement) via
  `assertAiUsageBudgetAvailable`/`recordAiUsageCost`, et remis à zéro à
  chaque renouvellement effectif (`payment.succeeded` avec `billing_reason:
  "subscription_cycle"` — Whop n'expose pas de date de début de période
  comme Stripe, donc le renouvellement se détecte par la raison de
  facturation plutôt que par comparaison de dates). Le plafond n'est
  affiché dans l'UI que s'il est atteint (`(app)/limite`) ; il n'y a plus de
  déblocage ponctuel en cours de période, seulement un changement de tier
  pour la période suivante.
- `FREE_PREVIEW_FRACTION = 0.1` : pour un non-abonné (ou un ex-abonné dont
  les fiches sauvegardées restent en base), `computePreviewCutoff` calcule
  un **pointeur** (section / sous-point / index de caractère) dans le
  contenu structuré de la fiche, une fois ~10 % du contenu total affiché en
  clair — le reste est flouté côté rendu, avec un bouton "Débloquer la
  fiche complète" qui ouvre le popup des 3 offres
  (`components/abonnement/pricing-modal.tsx`). Le contenu n'est jamais
  dupliqué ni tronqué côté serveur : c'est un pointeur de lecture, pas une
  copie du texte.

### Flux d'enregistrement d'une fiche — brouillon + Checkout différé

Matière/chapitre ne sont **plus** demandés juste après la génération : cet
écran (`components/fiches/new/creation-flow.tsx`) ne fait que sélectionner
les fiches à garder et éditer leur titre. Au clic sur "Enregistrer la
fiche" :

1. Le contenu sélectionné est stocké dans `public.fiche_drafts`
   (`POST /api/fiches/drafts`) — nécessaire car un utilisateur non abonné
   s'apprête à quitter entièrement le site pour Whop Checkout, ce que
   l'état React de la page ne survivrait pas.
2. Si l'utilisateur est déjà abonné (`GET /api/me`) → redirection directe
   vers `(app)/fiches/new/assign?draft=<id>`.
3. Sinon → le popup des 3 offres s'ouvre (`components/abonnement/pricing-
   modal.tsx`) ; le choix d'un tier déclenche `POST /api/whop/checkout` avec
   `{ tier, draftId }`. La configuration de checkout pointe son
   `redirect_url` (Whop n'a qu'une seule URL de retour, contrairement au
   `success_url`/`cancel_url` séparés de Stripe) vers cette même page
   `assign` (au lieu de `/abonnement`), pour reprendre exactement où
   l'utilisateur s'est arrêté une fois payé.

`(app)/fiches/new/assign` (`components/fiches/new/assign-flow.tsx`) gère
l'atterrissage post-Whop : comme le webhook peut arriver légèrement après
la redirection du navigateur, la page **sonde** `/api/me` (jusqu'à 8 fois,
1,5 s d'intervalle) avant d'afficher le choix matière/chapitre — c'est
seulement à cet endroit que la logique "première fiche = matière automatique
« Général », matières supplémentaires réservées aux abonnés" (déjà
appliquée avant) s'exécute, puisque désormais garantie d'être un abonné actif.
Une fois enregistrée via `POST /api/fiches` (inchangé), le brouillon est
supprimé (`DELETE /api/fiches/drafts/[draftId]`).

### `components/timer/session-timer-context.tsx` — chronomètre de session

Contexte React (persisté en `localStorage`) qui garde, par tâche de
planning, un temps accumulé + un éventuel horodatage de reprise. Une tâche
"démarre" (ou reprend) son chrono quand sa ligne est dépliée dans la page
Planning, et se **met en pause** (jamais totalement stoppée) dès qu'elle est
repliée ou que la page est quittée — pour reprendre exactement où elle en
était en y revenant. Le chronomètre n'est rendu (visuellement) que dans le
flux Planning ; ailleurs dans l'app, aucun composant ne l'affiche.

### `lib/files/docx.ts` — extraction de texte Word sans dépendance

Un `.docx` est une archive ZIP ; ce module lit l'en-tête ZIP local
(signatures + tailles, sans dépendance externe) pour extraire
`word/document.xml`, l'inflate avec `zlib.inflateRawSync` (Node natif), puis
convertit le XML en texte brut. Utilisé pour proposer un cas d'usage Word
sans ajouter de dépendance dédiée.

## Pages principales

`/` (redirection selon la session), `/login`, `/onboarding`,
`/auth/callback`, `(app)/fiches`, `(app)/fiches/[subjectId]`,
`(app)/fiches/[subjectId]/[chapterId]`,
`(app)/fiches/[subjectId]/[chapterId]/[ficheId]`, `(app)/fiches/new`,
`(app)/fiches/new/assign`,
`(app)/planning`, `(app)/quiz/[chapterId]`, `(app)/abonnement`,
`(app)/corbeille`, plus les Route Handlers sous `app/api/`.
