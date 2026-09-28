@AGENTS.md

# Virgule — guide pour Claude

Application de brainstorming (6 participants max par room, sans compte). Le fonctionnement et l'architecture sont décrits dans README.md, à lire en premier.

## Commandes

- `pnpm dev` pour lancer l'app ; `pnpm lint && pnpm typecheck && pnpm test` avant de considérer une tâche terminée.
- Après une modification de `prisma/schema.prisma` : `pnpm db:migrate --name <nom>`. Le client est généré dans `src/generated/prisma` (non versionné).
- `next typegen` régénère les types `PageProps` / `LayoutProps` / `RouteContext` quand on ajoute une route.

## Conventions

- **Next.js 16** : `params`, `cookies()` et `headers()` sont asynchrones ; en cas de doute, consulter `node_modules/next/dist/docs/`.
- **shadcn/ui sur Base UI** (et non Radix) : pas de `asChild`. On utilise la prop `render` (`<Button render={<Link href="/" />} nativeButton={false} />`). Ajouter un composant : `pnpm dlx shadcn@latest add <nom>`.
- **Aucune chaîne en dur dans l'UI** : tout passe par `messages/fr.json` (`useTranslations` côté client, `getTranslations` côté serveur). Les clés sont typées (`src/i18n/global.d.ts`).
- **Mutations** : uniquement dans `src/lib/actions.ts`, via `run()` + `guard()` (contrôle de la participation, du rôle et de la phase ; `refresh()` + notification Pusher). Une action renvoie un `ActionResult` dont l'erreur est une clé du namespace `errors`. Côté client, on l'appelle avec le hook `useAction()`.
- **Lectures** : dans `src/lib/room.ts`. `getRoomContext` est mis en cache par requête avec `React.cache` et partagé entre le layout et la page.
- **Logique métier pure** (scores, qualification, exports) dans `src/lib/results.ts` et `src/lib/export.ts`, couverte par des tests Vitest (`*.test.ts` à côté du fichier).
- **Anonymat** : ne jamais exposer au client `authorId`, les tokens, ni les votes des autres participants. Pendant la phase IDEAS, aucun score ne doit être visible.
- Commentaires et textes en français.

## Base de données

- Local : SQLite (`dev.db`). Production : Turso, via le même adapter libSQL (`src/lib/db.ts`).
- Les migrations de production s'appliquent avec `pnpm db:migrate:prod` (script maison `scripts/migrate-turso.mts`), et non avec `prisma migrate deploy`.
- Les suppressions se propagent en cascade depuis `Room`.
