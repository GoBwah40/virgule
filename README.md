# Virgule

Brainstorming and planning app for small groups (6 people maximum), with no account: you share a link, everyone gives their first name, suggests ideas and votes.

## How a session works

1. **Topics**: the person who creates the room becomes the **host**. They declare the topics and choose whether people can vote on their own ideas (enabled by default).
2. **Ideas & votes**: each participant suggests ideas in each topic and votes **for** or **against**. Ideas and votes are **anonymous**. Everyone can change their vote until voting closes; scores are not visible during the vote.
3. **Recap**: ideas are ranked by score. The host chooses the qualification rule (by default, *positive score*: more "for" than "against"; otherwise, a single "for" is enough). They can then:
   - **start a new round**: only the kept ideas remain, votes are reset and new ideas can be suggested;
   - **reopen voting** for the current round;
   - **end the session**: the room becomes read-only.

The host drives the phases, and all participants follow automatically. The recap keeps the history of each round and can be exported as **Markdown**, **CSV** (Excel-compatible) or **PDF** (through the browser's print dialog).

A room expires **7 days** after it is created; a daily scheduled job then deletes it.

## Stack

| Need | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| UI | shadcn/ui (on Base UI), Tailwind CSS v4, lucide-react |
| Database | Prisma 7 + libSQL adapter: SQLite file locally, [Turso](https://turso.tech) in production |
| Real time | [Pusher Channels](https://pusher.com/channels) (optional), with automatic fallback to polling |
| Rate limiting | [Upstash Redis](https://upstash.com) (optional), per IP and per participant |
| i18n | next-intl: English and French |
| Quality | Vitest + Testing Library, Playwright, Storybook 10, ESLint, knip |
| Hosting | Vercel (+ Vercel Cron for the purge) |

## Running locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install              # also generates the Prisma client
cp .env.example .env      # the default config is enough locally
pnpm db:migrate           # creates dev.db and applies the migrations
pnpm dev                  # http://localhost:3000
```

To test with several people on the same machine, open the room link on `http://localhost:3000` **and** on `http://127.0.0.1:3000`: they are two distinct origins, so two different participants. A private browsing window works too.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm preprod` | Local preproduction: production build on http://localhost:3001, preview database (see below) |
| `pnpm check` | Lint, types, tests and knip: run before every commit (GitHub Actions CI runs it again on every push and pull request) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Vitest tests: logic (Node) and components (jsdom) |
| `pnpm test:e2e` | Playwright end-to-end tests (`e2e/`): builds and starts the app on port 3100 against a throwaway `e2e.db`, plus a second server with Pusher turned on (port 3101, `e2e-pusher.db`) for `e2e/pusher.spec.ts` (CI runs them in a separate job). First time: `pnpm exec playwright install chromium` |
| `pnpm knip` | Detects unused files, exports and dependencies |
| `pnpm storybook` | Catalog of the global components on http://localhost:6006 |
| `pnpm db:migrate` | Creates or applies a migration on the local database |
| `pnpm db:migrate:prod` | Applies pending migrations on Turso |
| `pnpm db:migrate:preview` | Same on the preview database `virgule-preview` (reads `.env.preview.local`) |
| `pnpm db:reset` | Empties the local database and re-applies the migrations |
| `pnpm db:reset:remote` | Deletes every session from a Turso database (needs `RESET_CONFIRM=yes`); in CI, the **Reset database** workflow |
| `pnpm db:studio` | Prisma Studio (local database) |

### Local preproduction

Before merging into `main`, we check the version as it will go live: same production build, but on the Turso preview database `virgule-preview`, never on the production one.

```bash
pnpm db:migrate:preview   # if the branch contains a migration
pnpm preprod              # http://localhost:3001
```

Requirement: `.env.preview.local` at the project root (URL and token of `virgule-preview`, ignored by git). The script (`scripts/preprod.sh`) neutralizes the production variables Next.js would otherwise load from `.env.production.local` or `.env.local`: without Pusher values in `.env.preview.local`, preproduction syncs by polling, and without Upstash values, nothing is rate limited. It runs alongside `pnpm dev` without getting in its way.

## Versions and release notes

The app version is the one in `package.json` (semantic versioning, `0.x` for now); every visible production release creates a new one, with a git tag `vX.Y.Z`. Notes are written per language in [`release-notes/en/`](release-notes/en) and [`release-notes/fr/`](release-notes/fr), one file per category (`added.md`, `improved.md`, `fixed.md`), with the same versions and the same number of lines in each language. They are shown in the current language from the "What's new" button on the home page.

Numbering rules, note format and release steps: **[VERSIONS.md](VERSIONS.md)**.

## In production

**https://virgule.vercel.app**

| | |
| --- | --- |
| Hosting | Vercel, project `gobwah40s-projects/virgule`, functions in Dublin (`dub1`) |
| Database | Turso `virgule`, Ireland (`aws-eu-west-1`) |
| Deployment | Automatic on every version tag `vX.Y.Z` pushed (the highest one only), from GitHub Actions |
| Real time | Pusher Channels (cluster `eu`), with a fallback refresh every 30 seconds |

## Deploying on Vercel

Production runs on Vercel, with a [Turso](https://turso.tech) database (hosted SQLite): Vercel's disk is ephemeral, a SQLite file would not survive there. Pusher is optional.

The full step-by-step guide (creating the database, migrations, environment variables, cron, checks, troubleshooting) is in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

Production values are kept locally in `.env.production.local` (ignored by git). To apply a migration on Turso:

```bash
(set -a; . ./.env.production.local; set +a; pnpm db:migrate:prod)
```

Preview deployments use a separate `virgule-preview` database: apply each migration to it as well, with the values from `.env.preview.local`:

```bash
(set -a; . ./.env.preview.local; set +a; pnpm db:migrate:prod)
```

## Brand guidelines

- **Colors** (tokens in `src/app/globals.css`, dark mode following the device or the choice made in the footer): papaya `#F26A2E` (brand), burnt papaya `#C2410C` (actions), mango `#FFC23D` (highlight), sand `#FFF7F0` (background), fig ink `#2A1A24` (text). Olive `#1F7A4D` and pomegranate `#B8283F` are reserved for vote results. Every text/background pair meets AA contrast.
- **Typefaces** (`src/app/fonts.ts`): Bricolage Grotesque for headings, Figtree for text, DM Mono for seat letters.
- **Mobile first**: 44 px touch targets, one column, full-width primary actions.
- **Tone**: in English, second person ("you"), the group's voice ("we"), first names rather than roles, no slang or emoji. In French, tutoiement, « on » for the group, same rules. Vocabulary: session, participants, topics, ideas, recap; the person who creates the session "hosts" it.

## Architecture

```
.docs/                      Mockups and brand guidelines (standalone HTML, see .docs/README.md)
VERSIONS.md                 Version numbering and writing the notes
release-notes/en/           Release notes in English: added.md, improved.md, fixed.md
release-notes/fr/           Same notes in French (same versions and number of lines)
DEPLOYMENT.md               Step-by-step deployment on Vercel + Turso
messages/en.json            English UI copy (reference, typed keys)
messages/fr.json            French UI copy (same keys)
prisma/schema.prisma        Model: Room, Participant, Theme, Idea, Vote
scripts/migrate-turso.mts   Applies migrations on Turso
scripts/reset-turso.mts     Empties a Turso database (schema kept)
scripts/preprod.sh          Local preproduction (production build + preview database)
src/
  app/
    page.tsx                Home: room creation, release notes
    r/[slug]/layout.tsx     Access guard (not found / expired / join) + header + sync
    r/[slug]/page.tsx       Share link → redirects to the current phase
    r/[slug]/themes|ideas|recap/page.tsx   One page per phase
    r/[slug]/export/route.ts               Markdown / CSV export
    api/cron/purge/route.ts                Purge of expired rooms
  components/*.tsx          Reusable global components (+ .stories.tsx and .test.tsx)
  components/ui/            shadcn/ui primitives (Base UI)
  components/phases/        Assembly of the global components for each phase
  components/room/          Header, invitation, join form, real-time sync
  components/site/          Elements shared by every page (theme and language pickers)
  lib/actions.ts            All mutations (Server Actions) and their checks
  lib/room.ts               Reads: room context, vote view, recap
  lib/results.ts            Score and qualification rules (pure, tested)
  lib/export.ts             Export formats (pure, tested)
  lib/release-notes.ts      Parsing of the release notes (pure, tested); release-notes-source.ts loads them
  lib/realtime/             Server-side Pusher notification
  lib/rate-limit.ts         Rate limiting (Upstash, optional)
  i18n/                     next-intl configuration, supported languages, language detection
```

### Principles

- **Identity without an account**: joining a room creates a `Participant` with a random token, stored in an httpOnly cookie specific to the room (valid 7 days). Coming back with the same browser therefore does not use up a new seat. If the host loses this cookie (other device, cookies cleared), they also lose their role.
- **The server is authoritative**: every action checks participation, role (host or not) and the current phase. The client holds no critical business logic.
- **Anonymity**: the client never receives the author of an idea or other people's votes, only its own votes and, in the recap, the totals.
- **Synchronization**: after each mutation, the server sends a content-free notification through Pusher (or, without Pusher, clients poll the server every 3 seconds). Each client first asks for the current step (`/r/<slug>/phase`): if it changed, it navigates straight to the new step's page; otherwise it reloads the current page's state (`router.refresh()`). Navigating directly avoids the blank screen a server redirect would show during the transition.
- **Typed topics**: the host chooses the answer type of each topic (text, date, period, amount, range, place, list). Input adapts (the phone's date picker, numeric keyboard) and ideas are displayed cleanly ("June 1 – 14, 2027", "From €300 to €500"; in French « Du 1er au 14 juin 2027 », « De 300 € à 500 € »). The "Dates", "Place" and "Budget" suggestions are typed from the start.
  - **Place**: the idea carries a "View on the map" link that opens the installed app (Maps on Apple, Google Maps elsewhere), with no map loaded in Virgule.
  - **List**: the person hosting sets 2 to 10 options, which become ideas to vote on at launch; other suggestions can be allowed (disabled by default).
  - **In the recap**, a "Period" topic shows the slot shared by the kept periods ("Common slot: June 12 – 14, 2027", or failing that the most shared one), as a day strip or a calendar; a "Range" topic shows the compatible budget on a single scale.
- **Duplicates**: an idea identical to another one still in the running in the same topic is refused (text compared ignoring case, accents, punctuation and spaces; identical values for typed topics).
- **Ties**: in the recap, kept ideas tied for first in a topic carry a "Tied" badge. The person hosting can start a **tiebreak round**: in each topic, only the leading ideas remain (the tied ones, or the winner), votes start from zero and no idea can be added.
- **Timer** (optional, set with the topics: 3, 5, 10 or 15 min): it starts when ideas open and at each new round. Everyone sees the remaining time; the person hosting can add 2 minutes or stop it. When it ends, nothing is blocked.
- **Seat management**: right-click (or click) on an occupied seat, for the person hosting: **hand over hosting** to someone else, or **remove** a person (seat taken by mistake; their ideas and votes go with them).
- **Gentle reminder**: during voting, everyone sees how many ideas they still have to vote on; the person hosting also sees how many participants have voted, without knowing what.
- **Invitation**: link to copy, QR code to scan for a group gathered in the same place, and the phone's native sharing when the browser offers it.
- **What's new**: a button in the home page header (version number, and a dot until the latest version has been viewed on this browser) opens the release notes in a panel that slides up from the bottom of the screen.
- **Theme**: light or dark following the device, or chosen in the footer. The choice is kept in a cookie (`virgule_theme`) read by the root layout, which renders `data-theme` directly on `<html>`: no flash on load.
- **Languages**: English and French. The language is, in order: the one picked in the footer (`PreferenceMenu`, saved in the `virgule_locale` cookie), otherwise the first supported language of the device (`Accept-Language` header, `src/i18n/locale.ts`), otherwise English. There is no per-language URL. Exports, the root error page and the release notes follow the language.
- **Loading and errors**: skeletons with the dimensions of the real content while a step loads (`loading.tsx`), error pages with "Try again" and a way back to the home page, the session header staying visible when the error concerns a step.
- **Transitions**: step changes animated with React View Transitions (`PhaseTransition`), the header staying in place; soft appearance of new rows (ideas, topics, participants), a bounce on vote, a color fade in the recap. Everything is disabled when the device asks to reduce motion.
- **Rounds**: an idea carries its creation round (`createdRound`) and, if applicable, the round from which it is set aside (`eliminatedRound`). Votes are recorded per round, which keeps the full history.

### Adding a language

1. Create `messages/<locale>.json` with exactly the same keys as `en.json` (the reference, whose keys are typed in `src/i18n/global.d.ts`). The rule is checked by `src/i18n/messages.test.ts`: a key present in one language must exist in all the others, and no translation can be empty.
2. Add the locale to `locales` and its own name to `localeNames` in `src/i18n/config.ts`. Detection (cookie, then `Accept-Language`) and the footer picker pick it up automatically.
3. Add `release-notes/<locale>/` with `added.md`, `improved.md` and `fixed.md`: same versions, dates and number of lines per category as `release-notes/en/` (checked by `src/lib/release-notes.test.ts`).
4. Check date and amount formatting in `src/lib/idea-format.ts`: French builds its date ranges by hand, other languages use the native `Intl` range format; adjust the `ideas.dateRange*` and `ideas.amountRange*` messages if needed.
