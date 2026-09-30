# What is left to do

Status as of September 30, 2026.

## Production status

| Item | Value |
| --- | --- |
| URL | https://virgule.vercel.app |
| Vercel project | `gobwah40s-projects/virgule`, linked to the GitHub repo (every push to `main` deploys) |
| Server functions | Dublin (`dub1`, see `vercel.json`) |
| Database | Turso `virgule`, Ireland (`aws-eu-west-1`), migration `20260928074451_init` applied |
| Purge of expired sessions | Vercel Cron, every day at 3 AM UTC (`/api/cron/purge`), tested: answers `401` without the secret, `{"deleted":0}` with it |
| Real time | Pusher Channels, cluster `eu`: notification received live, checked in production on September 30. Automatic fallback to a refresh every 30 seconds |
| `main` protection | "main" ruleset active: pull request required, green "Lint, types, tests, knip" CI before merge, no deletion or force-push. Public repository |
| Test session | "Test de mise en ligne", created in production during the check, deleted automatically after 7 days |

## Vercel environment variables

Values are masked in Vercel; this table shows where each variable exists and what to do with it.

| Variable | Production | Preview | Status | Action |
| --- | --- | --- | --- | --- |
| `TURSO_DATABASE_URL` | ✅ | ⚠️ | Production: `virgule` database. Preview: unknown old value; the `virgule-preview` database is ready (see "Preview database"). | Replace the Preview value. |
| `TURSO_AUTH_TOKEN` | ✅ | ⚠️ | Same. | Replace the Preview value. |
| `CRON_SECRET` | ✅ | ⚠️ | The cron only runs in production. | Delete the Preview value, not needed. |
| `DATABASE_URL` | ⚠️ | ⚠️ | Created before going live. Ignored in production (`TURSO_DATABASE_URL` takes precedence), it is only used locally. | Delete from both environments to avoid confusion. |
| `PUSHER_APP_ID` | ✅ | ⏳ | Production: Pusher app `eu`. | Preview: fill in if needed. |
| `PUSHER_SECRET` | ✅ | ⏳ | Same. | Same. |
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ | ⏳ | Public by nature (read by the browser): *Config* type, not *Secret*. | Same. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ | ⏳ | `eu`, *Config* type. | Same. |

Legend: ✅ in place · ⚠️ to check or clean up · ⏳ to fill in later.

Locally, production values are in `.env.production.local` and preview values in `.env.preview.local` (ignored by git, readable only by you). Do not share them and never commit them.

### Clean up and complete the variables

Run from the project root. Values go through standard input: they are not displayed and do not stay in the terminal history.

```bash
(set -a; . ./.env.preview.local; set +a; printf %s "$TURSO_DATABASE_URL" | vercel env add TURSO_DATABASE_URL preview --force --sensitive; printf %s "$TURSO_AUTH_TOKEN" | vercel env add TURSO_AUTH_TOKEN preview --force --sensitive)
```

```bash
vercel env rm CRON_SECRET preview -y
```

```bash
vercel env rm DATABASE_URL preview -y
```

```bash
vercel env rm DATABASE_URL production -y
```

Then `vercel env ls` to check: Preview should only contain `TURSO_*` and `PUSHER_*`.

## Before inviting people

- [x] **Test with two people, locally** (September 30): two separate browsers (`localhost` and `127.0.0.1`, distinct cookies). Second participant arriving, move to ideas followed automatically, idea and vote visible on both sides, duplicate refused, vote indicators up to date.
- [ ] **Test with two people, from a phone**: open a session in production on the computer, join it from a phone (scan the invitation QR code), check that everything shows up on both sides in less than 3 seconds, and try the "Share" button.
- [ ] **Clean up the variables** flagged ⚠️ above: commands in "Clean up and complete the variables".
- [ ] **Check the first cron run** the next day: Vercel, *Settings → Cron Jobs*, or the project logs.

## Later

### Pusher (enabled on September 30)

Procedure followed, to repeat for Preview or when changing apps:

1. Create a *Channels* app on [pusher.com](https://pusher.com) (free Sandbox plan), cluster `eu`.
2. In *App Keys*, note `app_id`, `key`, `secret` and `cluster`, then add them in Vercel (Production, and Preview if needed), for example: `vercel env add PUSHER_SECRET production --force --sensitive` (the value is asked for without being displayed). The two `NEXT_PUBLIC_*` variables are public: Vercel refuses `--sensitive`, use `--no-sensitive`. The 4 variables: `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`. Also copy them into `.env.local` to test locally.
3. Redeploy: *Deployments → ⋯ → Redeploy*. `NEXT_PUBLIC_*` variables are embedded at build time, just saving them is not enough.
4. Check: updates become instant; on failure, logs show `[realtime] notification failed` and the app falls back to a refresh every 30 seconds.

No code change is needed.

### Preview database

Today, preview deployments (branches, pull requests) would use the Preview variables, whose value is unknown.

The separate `virgule-preview` database (Ireland, `aws-eu-west-1`) is created and all migrations are applied to it (September 30). Its URL and a token are in `.env.preview.local`. They still have to be copied into the Vercel Preview variables (see "Clean up and complete the variables").

Each new migration applies to both databases: production (command in "Useful commands") and preview:

```bash
(set -a; . ./.env.preview.local; set +a; pnpm db:migrate:prod)
```

### Quality and operations

- [x] **Continuous integration**: `.github/workflows/ci.yml` runs `pnpm check` and the Storybook build on every push to `main` and on every pull request.
- [x] **Make CI required** (September 30, repository made public): on GitHub, *Settings → Rules → Rulesets → New branch ruleset*, target `main`, check "Require status checks to pass" and choose "Lint, types, tests, knip". Without this rule, CI flags a problem but does not prevent merging. Note: on a **private** repository, these rules require GitHub Pro (or Team); with the free plan, either make the repository public or keep checking CI by hand before merging.
- [ ] **Custom domain** if needed: Vercel, *Settings → Domains*.
- [ ] **Rotate the Turso token** from time to time: `turso db tokens create virgule`, update `TURSO_AUTH_TOKEN` in Vercel and in `.env.production.local`, redeploy, then revoke the old one (`turso db tokens invalidate virgule` invalidates all existing tokens).
- [ ] **Backups**: check the restore options of your Turso plan.
- [ ] **Update the brand guidelines** in `.docs/brand-guidelines.html`: its examples still talk about travel.

## Known limitations

- The host role is tied to the cookie of the browser that created the session: on another device or after clearing cookies, it is lost. The person hosting can hand it over to someone else (seat menu), but only while they still have it.
- 6 participants maximum per session.
- English and French only; to add a language, see "Adding a language" in the README.

## Useful commands

Apply a new migration in production, with the values from `.env.production.local`:

```bash
(set -a; . ./.env.production.local; set +a; pnpm db:migrate:prod)
```

View production logs:

```bash
vercel logs virgule.vercel.app
```

Run the cron again by hand:

```bash
(set -a; . ./.env.production.local; set +a; curl -H "Authorization: Bearer $CRON_SECRET" https://virgule.vercel.app/api/cron/purge)
```
