@AGENTS.md

# Virgule — guide pour Claude

Application de brainstorming et de planification en petit groupe (6 participants max par room, sans compte). Le fonctionnement et l'architecture sont décrits dans README.md, à lire en premier.

## Commandes

- `pnpm dev` pour lancer l'app ; **`pnpm check`** (lint, types, tests, knip) doit passer avant de considérer une tâche terminée.
- `pnpm storybook` pour travailler un composant isolément.
- Après une modification de `prisma/schema.prisma` : `pnpm db:migrate --name <nom>`. Le client est généré dans `src/generated/prisma` (non versionné).
- `next typegen` régénère les types `PageProps` / `LayoutProps` / `RouteContext` quand on ajoute une route.

## Conventions

- **Composants globaux, pas de composant unique** : toute brique d'interface vit dans `src/components/<nom>.tsx`, générique et pilotée par ses props (libellés compris : pas de `useTranslations` dedans, sauf `ConfirmButton`). Les pages et `components/phases/` ne font qu'assembler ces composants. Avant d'écrire du balisage stylé dans une page, vérifier si un composant existe (ListItem, VoteButtons, StatusBadge, SeatRow, SuggestionChips, PhaseStepper, PageHeader, FormField, SettingSwitch, CopyButton, IconList, ConfirmButton, StatusPage) ; sinon, en créer un.
- **Chaque composant global a sa story** (`<nom>.stories.tsx`, un cas par état utile) **et ses tests** (`<nom>.test.tsx`, rendu via `renderUi` de `src/test/render.tsx`).
- **Charte** : couleurs via les tokens (`bg-primary`, `bg-highlight-soft`, `bg-success`, `text-destructive`…), jamais de couleur Tailwind brute. Titres en `font-heading`. Mobile d'abord : 44 px minimum pour tout ce qui se touche.
- **Ton** : tutoiement, « on » pour le groupe, prénom de la personne qui anime plutôt que son rôle (`hostName()`), pas d'argot ni d'emoji.
- **knip** : ne pas laisser d'export, de fichier ni de dépendance inutilisés ; `knip.json` liste les rares exceptions (dépendances chargées par le CSS ou par le client Prisma généré).
- **Next.js 16** : `params`, `cookies()` et `headers()` sont asynchrones ; en cas de doute, consulter `node_modules/next/dist/docs/`.
- **shadcn/ui sur Base UI** (et non Radix) : pas de `asChild`. On utilise la prop `render` (`<Button render={<Link href="/" />} nativeButton={false} />`). Ajouter un composant : `pnpm dlx shadcn@latest add <nom>`.
- **Aucune chaîne en dur dans l'UI** : tout passe par `messages/fr.json` (`useTranslations` côté client, `getTranslations` côté serveur). Les clés sont typées (`src/i18n/global.d.ts`).
- **Même clés dans toutes les langues** : ajouter, renommer ou supprimer une clé dans un fichier `messages/*.json` impose de faire de même dans tous les autres, sans valeur vide. Vérifié par `src/i18n/messages.test.ts` (inclus dans `pnpm check`).
- **Mutations** : uniquement dans `src/lib/actions.ts`, via `run()` + `guard()` (contrôle de la participation, du rôle et de la phase ; `refresh()` + notification Pusher). Une action renvoie un `ActionResult` dont l'erreur est une clé du namespace `errors`. Côté client, on l'appelle avec le hook `useAction()`.
- **Lectures** : dans `src/lib/room.ts`. `getRoomContext` est mis en cache par requête avec `React.cache` et partagé entre le layout et la page.
- **Logique métier pure** (scores, qualification, exports) dans `src/lib/results.ts` et `src/lib/export.ts`, couverte par des tests Vitest (`*.test.ts` à côté du fichier).
- **Anonymat** : ne jamais exposer au client `authorId`, les tokens, ni les votes des autres participants. Pendant la phase IDEAS, aucun score ne doit être visible.
- Commentaires et textes en français.

## Base de données

- Local : SQLite (`dev.db`). Production : Turso, via le même adapter libSQL (`src/lib/db.ts`).
- Les migrations de production s'appliquent avec `pnpm db:migrate:prod` (script maison `scripts/migrate-turso.mts`), et non avec `prisma migrate deploy`.
- Les suppressions se propagent en cascade depuis `Room`.
