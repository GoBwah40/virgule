@AGENTS.md

# Virgule — guide pour Claude

Application de brainstorming et de planification en petit groupe (6 participants max par room, sans compte). Le fonctionnement et l'architecture sont décrits dans README.md, à lire en premier.

## Commandes

- `pnpm dev` pour lancer l'app ; **`pnpm check`** (lint, types, tests, knip) doit passer avant de considérer une tâche terminée.
- `pnpm storybook` pour travailler un composant isolément.
- Après une modification de `prisma/schema.prisma` : `pnpm db:migrate --name <nom>`. Le client est généré dans `src/generated/prisma` (non versionné).
- `next typegen` régénère les types `PageProps` / `LayoutProps` / `RouteContext` quand on ajoute une route.

## Conventions

- **Composants globaux, pas de composant unique** : toute brique d'interface vit dans `src/components/<nom>.tsx`, générique et pilotée par ses props (libellés compris : pas de `useTranslations` dedans, sauf `ConfirmButton`). Les pages et `components/phases/` ne font qu'assembler ces composants. Avant d'écrire du balisage stylé dans une page, vérifier si un composant existe (ListItem, VoteButtons, StatusBadge, SeatRow, SuggestionChips, PhaseStepper, PageHeader, PhaseTransition, ProgressMeter, ExpandableListItem, VoteSummary, SegmentedControl, DateField, AmountField, IconBadge, FormField, SettingSwitch, CopyButton, IconList, ConfirmButton, StatusPage, ErrorFallback, et pour le chargement LoadingState, PageHeaderSkeleton, ListItemSkeleton, CardSkeleton) ; sinon, en créer un.
- **Chaque composant global a sa story** (`<nom>.stories.tsx`, un cas par état utile) **et ses tests** (`<nom>.test.tsx`, rendu via `renderUi` de `src/test/render.tsx`).
- **Charte** : couleurs via les tokens (`bg-primary`, `bg-highlight-soft`, `bg-success`, `text-destructive`…), jamais de couleur Tailwind brute. Titres en `font-heading`. Mobile d'abord : 44 px minimum pour tout ce qui se touche.
- **Mouvements** : courts (≤ 300 ms) et discrets, toujours derrière `motion-safe:` (réglage « réduire les animations » respecté). Chaque page d'étape est enveloppée dans `PhaseTransition` (View Transitions de React) ; l'en-tête de séance porte `viewTransitionName: "room-header"` pour rester fixe. Styles dans la section « Mouvements » de `globals.css`.
- **Chargement et erreurs** : chaque page d'étape a son `loading.tsx`, composé de `LoadingState` et des squelettes (mêmes dimensions que le vrai contenu, pour éviter les sauts). Le layout de séance lit un cookie : `loading.js` ne peut pas le couvrir, l'en-tête est donc toujours rendu côté serveur. Erreurs : `app/error.tsx` (pages), `app/r/[slug]/error.tsx` (étapes, sous l'en-tête), `app/global-error.tsx` (layout racine, fournit son propre `<html>`, ses styles et ses traductions). En Next 16, les pages d'erreur reçoivent `retry()` (recharge les données), à préférer à `reset()`.
- **Ton** : tutoiement, « on » pour le groupe, prénom de la personne qui anime plutôt que son rôle (`hostName()`), pas d'argot ni d'emoji.
- **knip** : ne pas laisser d'export, de fichier ni de dépendance inutilisés ; `knip.json` liste les rares exceptions (dépendances chargées par le CSS ou par le client Prisma généré).
- **Next.js 16** : `params`, `cookies()` et `headers()` sont asynchrones ; en cas de doute, consulter `node_modules/next/dist/docs/`.
- **shadcn/ui sur Base UI** (et non Radix) : pas de `asChild`. On utilise la prop `render` (`<Button render={<Link href="/" />} nativeButton={false} />`). Ajouter un composant : `pnpm dlx shadcn@latest add <nom>`.
- **Aucune chaîne en dur dans l'UI** : tout passe par `messages/fr.json` (`useTranslations` côté client, `getTranslations` côté serveur). Les clés sont typées (`src/i18n/global.d.ts`).
- **Même clés dans toutes les langues** : ajouter, renommer ou supprimer une clé dans un fichier `messages/*.json` impose de faire de même dans tous les autres, sans valeur vide. Vérifié par `src/i18n/messages.test.ts` (inclus dans `pnpm check`).
- **Mutations** : uniquement dans `src/lib/actions.ts`, via `run()` + `guard()` (contrôle de la participation, du rôle et de la phase ; `refresh()` + notification Pusher). Une action qui change d'étape passe la nouvelle phase en 3ᵉ argument de `run()` : elle redirige alors directement vers la bonne page (rafraîchir l'ancienne produirait un rendu vide intermédiaire qui casse la transition). Une action renvoie un `ActionResult` dont l'erreur est une clé du namespace `errors`. Côté client, on l'appelle avec le hook `useAction()`.
- **Lectures** : dans `src/lib/room.ts`. `getRoomContext` est mis en cache par requête avec `React.cache` et partagé entre le layout et la page.
- **Sujets typés** : chaque sujet a un `kind` (TEXT, DATE, DATE_RANGE, AMOUNT, AMOUNT_RANGE), non modifiable une fois des idées proposées. Validation et mise en forme dans `src/lib/idea-value.ts` (pur, testé) ; formateurs français dans `src/lib/idea-format.ts`. Dates stockées en « AAAA-MM-JJ » et affichées en UTC (aucun décalage de jour), montants en euros entiers. `room.ts` renvoie le texte déjà mis en forme dans `content`.
- **Logique métier pure** (scores, qualification, exports) dans `src/lib/results.ts` et `src/lib/export.ts`, couverte par des tests Vitest (`*.test.ts` à côté du fichier).
- **Anonymat** : ne jamais exposer au client `authorId`, les tokens, ni les votes des autres participants. Pendant la phase IDEAS, aucun score ne doit être visible.
- Commentaires et textes en français.

## Base de données

- Local : SQLite (`dev.db`). Production : Turso, via le même adapter libSQL (`src/lib/db.ts`).
- Les migrations de production s'appliquent avec `pnpm db:migrate:prod` (script maison `scripts/migrate-turso.mts`), et non avec `prisma migrate deploy`.
- **Migrations additives uniquement** (`ALTER TABLE … ADD COLUMN`) : ne jamais laisser passer un « RedefineTables » de Prisma (`DROP TABLE` + `PRAGMA foreign_keys=OFF`). Le script Turso applique chaque migration dans une transaction, où SQLite ignore ce PRAGMA : le `DROP TABLE` déclencherait les suppressions en cascade (votes, idées). Le script refuse ces migrations. Ajouter une valeur par défaut à une colonne existante ou changer son type provoque une reconstruction : l'éviter, ou écrire la migration à la main.
- Les suppressions se propagent en cascade depuis `Room`.
