# Revix

Revix est une application de révision pour lycéens/étudiants : elle transforme
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
- **Paiement** : Stripe (abonnement mensuel à 9,99 €)
- **Hébergement cible** : Vercel

## Mise en route

### 1. Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner :

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
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
- `0002_ai_lock.sql` : table `ai_lock` (1 seule ligne) + fonctions
  `try_acquire_ai_lock` / `release_ai_lock`, le verrou global qui sérialise
  tous les appels à Claude (voir plus bas).
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

### 5. Stripe (optionnel en local)

Pour tester les paiements en local, utiliser la Stripe CLI afin de relayer
les webhooks vers `/api/stripe/webhook` :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Sans webhook configuré, un paiement Stripe ne mettra jamais à jour la table
`subscriptions` — l'abonnement ne passera donc jamais à `active` en local.

## Architecture — modules métier clés

### `lib/anthropic/lock.ts` — verrou IA global

Toutes les générations IA de l'application (fiches ET quiz, en avant-plan ou
en tâche de fond) passent par `withAiLock()`, qui s'appuie sur la table
`ai_lock` et ses deux fonctions SQL. Une seule ligne, mise à jour par un
`UPDATE ... WHERE` conditionnel : ça fonctionne avec un pooler Postgres en
mode transaction (Supavisor/pgbouncer), contrairement à
`pg_advisory_lock` qui exige une connexion de niveau session. Le verrou a un
timeout de staleness (120s) pour ne jamais rester bloqué après un crash, et
`withAiLock` fait un polling (toutes les 500ms, jusqu'à 90s) en attendant sa
libération. **Aucun appel à Claude n'est fait ailleurs que dans
`lib/anthropic/client.ts`, qui appelle systématiquement `withAiLock`** — donc
il est structurellement impossible qu'un second appel IA s'exécute en
parallèle, quelle que soit la fonctionnalité qui le déclenche.

### `lib/anthropic/client.ts` — appel Claude avec validation stricte

`generateJson()` encapsule l'appel à l'API Messages de Claude (modèle
`claude-opus-5`) et exige une réponse JSON strictement valide. Une réponse
peut être un succès HTTP (200) tout en étant vide ou tronquée
(`stop_reason === "max_tokens"`) — dans les deux cas, comme en cas de JSON
invalide ou de structure incomplète (le paramètre `validate` fourni par
l'appelant), la fonction relance automatiquement l'appel (jusqu'à 3
tentatives) avant d'abandonner avec une erreur explicite.

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

### `lib/subscription/gate.ts` + `lib/subscription/preview.ts` — modèle économique

- La génération de fiches est **gratuite et illimitée** pour tout le monde.
- La **lecture** (et donc l'enregistrement) est réservée aux abonnés actifs :
  `POST /api/fiches` renvoie 402 si l'utilisateur n'a pas d'abonnement actif.
- `MONTHLY_FICHE_CAP = 20` : plafond de fiches *enregistrées* par mois,
  appliqué uniquement aux abonnés actifs et décompté au moment de
  l'enregistrement (jamais à la génération) via
  `checkAndIncrementFicheQuota`. Il n'est affiché dans l'UI que s'il est
  atteint.
- `FREE_PREVIEW_SENTENCES = 2` : pour un non-abonné, `computePreviewCutoff`
  calcule un **pointeur** (section / sous-point / index de caractère) dans le
  contenu structuré de la fiche, jusqu'où l'affichage reste en clair — le
  reste est flouté côté rendu. Le contenu n'est jamais dupliqué ni tronqué
  côté serveur : c'est un pointeur de lecture, pas une copie du texte.

### Flux d'enregistrement d'une fiche — brouillon + Checkout différé

Matière/chapitre ne sont **plus** demandés juste après la génération : cet
écran (`components/fiches/new/creation-flow.tsx`) ne fait que sélectionner
les fiches à garder et éditer leur titre. Au clic sur "Enregistrer la
fiche" :

1. Le contenu sélectionné est stocké dans `public.fiche_drafts`
   (`POST /api/fiches/drafts`) — nécessaire car un utilisateur non abonné
   s'apprête à quitter entièrement le site pour Stripe Checkout, ce que
   l'état React de la page ne survivrait pas.
2. Si l'utilisateur est déjà abonné (`GET /api/me`) → redirection directe
   vers `(app)/fiches/new/assign?draft=<id>`.
3. Sinon → `POST /api/stripe/checkout` avec ce `draftId` ; la session Stripe
   pointe son `success_url`/`cancel_url` vers cette même page `assign` (au
   lieu de `/abonnement`), pour reprendre exactement où l'utilisateur s'est
   arrêté une fois payé (ou annulé).

`(app)/fiches/new/assign` (`components/fiches/new/assign-flow.tsx`) gère
l'atterrissage post-Stripe : comme le webhook peut arriver légèrement après
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
