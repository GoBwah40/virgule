@AGENTS.md

# Virgule — guide for Claude

Brainstorming and planning app for small groups (6 participants max per room, no account). How it works and its architecture are described in README.md, to read first.

## Commands

- `pnpm dev` to run the app; **`pnpm check`** (lint, types, tests, knip) must pass before a task is considered done.
- `pnpm storybook` to work on a component in isolation.
- `pnpm test:e2e`: Playwright end-to-end tests in `e2e/` (production build on port 3100, throwaway `e2e.db`; a second server on port 3101 has Pusher on, played by the tests with `page.routeWebSocket`; not part of `pnpm check`, run by CI in its own job).
- `pnpm preprod`: local production build on http://localhost:3001, against the `virgule-preview` database (needs `.env.preview.local`).
- After changing `prisma/schema.prisma`: `pnpm db:migrate --name <name>`. The client is generated in `src/generated/prisma` (not versioned).
- `next typegen` regenerates the `PageProps` / `LayoutProps` / `RouteContext` types when adding a route.

## Conventions

- **English in the repo**: code comments, docs, commits, pull request titles and descriptions are written in English. Only the French UI copy (`messages/fr.json`) and French release notes (`release-notes/fr/`) are in French.
- **Global components, no one-off components**: every UI building block lives in `src/components/<name>.tsx`, generic and driven by its props (labels included: no `useTranslations` inside, except `ConfirmButton` and `ConfirmDialog` for "Cancel"). Pages and `components/phases/` only assemble these components. Before writing styled markup in a page, check whether a component exists (ListItem, VoteButtons, StatusBadge, SeatRow, SuggestionChips, PhaseStepper, PageHeader, PhaseTransition, ProgressMeter, ExpandableListItem, VoteSummary, SegmentedControl, DateField, AmountField, IconBadge, PreferenceMenu, QrCode, ShareButton, Countdown, ConfirmDialog, OptionListField, MapLink, OverviewSummary, DateOverview, AmountOverview, FormField, SettingSwitch, CopyButton, IconList, ConfirmButton, StatusPage, ErrorFallback, Logo, Rosette, KeyFigures, ReleaseNotesSheet, MasonryColumns, and for loading LoadingState, PageHeaderSkeleton, ListItemSkeleton, CardSkeleton); otherwise, create one.
- **Every global component has its story** (`<name>.stories.tsx`, one case per useful state) **and its tests** (`<name>.test.tsx`, rendered with `renderUi` from `src/test/render.tsx`, which renders in English with `messages/en.json`).
- **Brand**: colors through tokens (`bg-primary`, `bg-highlight-soft`, `bg-success`, `text-destructive`…), never a raw Tailwind color. Headings in `font-heading`. Theme: the `dark:` variant covers dark mode chosen by the user (`data-theme="dark"` on `<html>`) as well as the device's; dark tokens are declared once with `@variant dark` in `globals.css`. The only exception to tokens: the QR code, always ink on white to stay scannable. Mobile first: 44 px minimum for anything touchable.
- **Motion**: short (≤ 300 ms) and subtle, always behind `motion-safe:` (the "reduce motion" setting is respected). Each step page is wrapped in `PhaseTransition` (React View Transitions); the session header carries `viewTransitionName: "room-header"` to stay in place. Styles in the motion section of `globals.css`.
- **Loading and errors**: each step page has its `loading.tsx`, made of `LoadingState` and the skeletons (same dimensions as the real content, to avoid jumps). The session layout reads a cookie: `loading.js` cannot cover it, so the header is always rendered server-side. Errors: `app/error.tsx` (pages), `app/r/[slug]/error.tsx` (steps, below the header), `app/global-error.tsx` (root layout, provides its own `<html>`, styles and translations, and follows the language). In Next 16, error pages receive `retry()` (reloads the data), to prefer over `reset()`.
- **Tone** (UI copy and release notes):
  - English: second person "you", "we" for the group, the host's first name rather than their role (`hostName()`), no slang or emoji.
  - French: tutoiement, « on » for the group, the host's first name rather than their role (`hostName()`), no slang or emoji.
- **No hard-coded string in the UI**: everything goes through `messages/en.json` (reference, keys typed in `src/i18n/global.d.ts`) and `messages/fr.json` (`useTranslations` client-side, `getTranslations` server-side).
- **Same keys in every language**: adding, renaming or removing a key in one `messages/*.json` file means doing the same in all the others, with no empty value. Checked by `src/i18n/messages.test.ts` (part of `pnpm check`). Supported languages are listed in `src/i18n/config.ts` (`locales`, `localeNames`, `defaultLocale = "en"`).
- **Versions** (rules in VERSIONS.md): every change visible to users bumps `version` in `package.json` (feature → MINOR, otherwise PATCH).
- **Release notes in both languages**: every visible change is written in `release-notes/en/` and `release-notes/fr/` (`added.md`, `improved.md`, `fixed.md`), with the same versions, dates and number of lines per category. Checked by `src/lib/release-notes.test.ts`. Rules in VERSIONS.md.
- **knip**: leave no unused export, file or dependency; `knip.json` lists the rare exceptions (dependencies loaded by the CSS or by the generated Prisma client).
- **Next.js 16**: `params`, `cookies()` and `headers()` are asynchronous; when in doubt, check `node_modules/next/dist/docs/`.
- **shadcn/ui on Base UI** (not Radix): no `asChild`. Use the `render` prop (`<Button render={<Link href="/" />} nativeButton={false} />`). To add a component: `pnpm dlx shadcn@latest add <name>`.
- **Mutations**: only in `src/lib/actions.ts`, through `run()` + `guard()` (checks participation, role and phase; `refresh()` + Pusher notification). An action that changes step passes the new phase as the 3rd argument of `run()`: it then redirects straight to the right page (refreshing the old one would produce an intermediate blank render that breaks the transition). An action returns an `ActionResult` whose error is a key of the `errors` namespace. Client-side, call it with the `useAction()` hook.
- **Reads**: in `src/lib/room.ts`. `getRoomContext` is cached per request with `React.cache` and shared between the layout and the page.
- **Typed topics**: each topic has a `kind` (TEXT, DATE, DATE_RANGE, AMOUNT, AMOUNT_RANGE, PLACE, CHOICE), not editable once ideas have been suggested. Validation and formatting in `src/lib/idea-value.ts` (pure, tested); formatters in the current language in `src/lib/idea-format.ts` (French builds « Du 1er au 14 juin 2027 » by hand, other languages use the native `Intl` date range, "June 1 – 14, 2027"). Dates stored as "YYYY-MM-DD" and displayed in UTC (no day shift), amounts in whole euros. `room.ts` returns the already formatted text in `content`. Duplicates are refused by `addIdea` through `ideaKey`.
- **Pure business logic** (scores, qualification, exports) in `src/lib/results.ts` and `src/lib/export.ts`, covered by Vitest tests (`*.test.ts` next to the file). Exports follow the language.
- **Anonymity**: never expose `authorId`, tokens, or other participants' votes to the client. During the IDEAS phase, no score may be visible.

## Database

- Local: SQLite (`dev.db`). Production: Turso, through the same libSQL adapter (`src/lib/db.ts`).
- Production migrations are applied with `pnpm db:migrate:prod` (custom script `scripts/migrate-turso.mts`), not with `prisma migrate deploy`. Two Turso databases to migrate: `virgule` (production, `.env.production.local`) and `virgule-preview` (preview deployments, `.env.preview.local`).
- **Additive migrations only** (`ALTER TABLE … ADD COLUMN`): never let a Prisma "RedefineTables" through (`DROP TABLE` + `PRAGMA foreign_keys=OFF`). The Turso script applies each migration in a transaction, where SQLite ignores this PRAGMA: the `DROP TABLE` would trigger cascading deletes (votes, ideas). The script refuses these migrations. Adding a default value to an existing column or changing its type causes a rebuild: avoid it, or write the migration by hand.
- Deletes cascade from `Room`.
