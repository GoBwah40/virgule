# What is left to do

Status as of September 30, 2026.

## Production status

| Item | Value |
| --- | --- |
| URL | https://virgule.vercel.app |
| Vercel project | `gobwah40s-projects/virgule`, linked to the GitHub repo (every version tag deploys production, see DEPLOYMENT.md step 7) |
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
| `TURSO_DATABASE_URL` | ✅ | ✅ | Production: `virgule` database. Preview: `virgule-preview` database (September 30). | — |
| `TURSO_AUTH_TOKEN` | ✅ | ✅ | Same. | — |
| `CRON_SECRET` | ✅ | — | The cron only runs in production. | Done: no Preview value. |
| `DATABASE_URL` | — | — | Only used locally. | Done: removed from both environments. |
| `PUSHER_APP_ID` | ✅ | — | Production: Pusher app `eu`. Preview: removed on September 30, preview deployments sync by polling. | Preview: fill in if needed. |
| `PUSHER_SECRET` | ✅ | — | Same. | Same. |
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ | — | Public by nature (read by the browser): *Config* type, not *Secret*. | Same (with `--no-sensitive`). |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ | — | `eu`, *Config* type. | Same. |

Legend: ✅ in place · ⚠️ to check or clean up · ⏳ to fill in later · — not set.

Locally, production values are in `.env.production.local` and preview values in `.env.preview.local` (ignored by git, readable only by you). Do not share them and never commit them.

### Update the Preview Turso variables

Done on September 30. To repeat after rotating the `virgule-preview` token, from the project root (`.env.preview.local` is not copied into worktrees). Values go through standard input: they are not displayed and do not stay in the terminal history. The checks stop before sending anything if a value is missing, and `--yes` targets every Preview branch instead of asking for one.

```bash
(set -a && . ./.env.preview.local && set +a && test -n "$TURSO_DATABASE_URL" && test -n "$TURSO_AUTH_TOKEN" && printf %s "$TURSO_DATABASE_URL" | vercel env add TURSO_DATABASE_URL preview --force --sensitive --yes && printf %s "$TURSO_AUTH_TOKEN" | vercel env add TURSO_AUTH_TOKEN preview --force --sensitive --yes)
```

Each line should end with "Overrode": the creation date shown by `vercel env ls` does not change on an overwrite. Existing preview deployments keep the old values until they are redeployed.

## Before inviting people

- [x] **Test with two people, locally** (September 30): two separate browsers (`localhost` and `127.0.0.1`, distinct cookies). Second participant arriving, move to ideas followed automatically, idea and vote visible on both sides, duplicate refused, vote indicators up to date.
- [ ] **Test with two people, from a phone**: open a session in production on the computer, join it from a phone (scan the invitation QR code), check that everything shows up on both sides in less than 3 seconds, and try the "Share" button.
- [x] **Clean up the Vercel variables** (September 30): Preview now points to `virgule-preview`, old values removed.
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

The separate `virgule-preview` database (Ireland, `aws-eu-west-1`) is created and all migrations are applied to it (September 30). Its URL and a token are in `.env.preview.local` and, since September 30, in the Vercel Preview variables: preview deployments (branches, pull requests) use it.

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
- [x] **Update the brand guidelines** in `.docs/brand-guidelines.html` (September 30): the examples follow a birthday instead of a trip, and typed topics list Place and List.

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
