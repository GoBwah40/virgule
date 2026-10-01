# Deploying Virgule on Vercel with Turso

This guide starts from the GitHub repository `GoBwah40/virgule` and ends with a live app, with a Turso database and, optionally, real time with Pusher. Allow about twenty minutes the first time.

## Why Turso?

On Vercel, code runs in serverless functions whose disk is ephemeral and read-only. A SQLite file would be lost at every deployment, or even at every request. Turso hosts a SQLite (libSQL) database reachable over the network. The app uses the same Prisma libSQL adapter locally and in production (`src/lib/db.ts`):

| Environment | Database | Variables read |
| --- | --- | --- |
| Local | `dev.db` file | `DATABASE_URL` |
| Production | Turso | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (take precedence) |

A local file is switched to WAL mode on the first connection (stored in the file, next to `dev.db-wal` and `dev.db-shm`): in the default journal mode, a write committed while another connection reads could lock the database until the server restarts. To start over by hand, delete the three files together, never `dev.db` alone.

Turso's free plan is more than enough for this use.

## Requirements

- A [GitHub](https://github.com) account with the repository pushed.
- A [Vercel](https://vercel.com) account (free Hobby plan) linked to GitHub.
- A [Turso](https://turso.tech) account (free plan).
- On your machine: Node.js 20+, pnpm, and the project installed (`pnpm install`).

## 1. Create the Turso database

Install the Turso CLI, then log in:

```bash
brew install tursodatabase/tap/turso
```

```bash
turso auth login
```

Without Homebrew, use `curl -sSfL https://get.tur.so/install.sh | bash`. To create an account from the CLI, run `turso auth signup`.

Create the database:

```bash
turso db create virgule --location aws-eu-west-1
```

Turso does not offer Paris: Ireland (`aws-eu-west-1`) is the closest European region. Vercel functions run in Dublin (`"regions": ["dub1"]` in `vercel.json`), next to the database: each request makes several round trips to the database, so this distance is what matters most.

Get its URL. It starts with `libsql://`:

```bash
turso db show virgule --url
```

Create an access token:

```bash
turso db tokens create virgule
```

Write down both values: they are `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. The token gives full access to the database, never commit it.

## 2. Create the tables (migrations)

Prisma migrations (`prisma/migrations/`) are applied on Turso by the `scripts/migrate-turso.mts` script, not by `prisma migrate deploy`. From the project root:

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" pnpm db:migrate:prod
```

The script prints `✔ 1 migration(s) applied.` It records what has already been applied in the `_virgule_migrations` table: running it again does nothing if the database is up to date.

To check the result, list the tables. You should see `Room`, `Participant`, `Theme`, `Idea`, `Vote` and `_virgule_migrations`:

```bash
turso db shell virgule ".tables"
```

## 3. (Optional) Set up Pusher for real time

Without Pusher, each browser resyncs every 3 seconds, which is fine for 6 people. With Pusher, updates are instant.

1. Create an account on [pusher.com](https://pusher.com), then a **Channels** app. The *Sandbox* plan is free: 200,000 messages per day, 100 concurrent connections.
2. Choose the cluster closest to your users, for example `eu`.
3. In the **App Keys** tab, note `app_id`, `key`, `secret` and `cluster`.

Messages sent to Pusher contain no data: they only tell browsers to reload the state from the server.

### Also optional: rate limiting with Upstash

Without Upstash, nothing is limited: a script could create rooms in bulk and fill the database until the nightly purge. With it, the app refuses (with a "You're going a bit fast" message) more than 10 rooms created per hour and 30 joins per 10 minutes from the same IP, and more than 120 actions per minute from the same participant. Limits are in `src/lib/rate-limit.ts`; if Upstash does not answer within a second, requests go through.

1. Create an account on [upstash.com](https://console.upstash.com), then a **Redis** database in the region closest to Vercel's functions (`eu-west-1`, Ireland). The free plan is enough.
2. In the database's **REST API** section, note `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Previews can share the same database: keys only hold counters (IP or participant id), which expire with their window.

## 4. Generate the cron secret

A scheduled job deletes expired rooms (7 days) every night. It is protected by a secret:

```bash
openssl rand -hex 32
```

Write down the value: it will be `CRON_SECRET`.

## 5. Import the project into Vercel

1. On [vercel.com/new](https://vercel.com/new), import the `GoBwah40/virgule` repository.
2. Vercel detects **Next.js** and **pnpm** (`packageManager` field of `package.json`). Keep the default build settings. The `pnpm build` command runs `prisma generate && next build`, and the Prisma client is also generated on `postinstall`.
3. Before clicking **Deploy**, open **Environment Variables** and add:

| Variable | Value | Required |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | `libsql://…` URL from step 1 | Yes |
| `TURSO_AUTH_TOKEN` | token from step 1 | Yes |
| `CRON_SECRET` | value from step 4 | Yes |
| `PUSHER_APP_ID` | `app_id` | No (real time) |
| `PUSHER_SECRET` | `secret` | No (real time) |
| `NEXT_PUBLIC_PUSHER_KEY` | `key` | No (real time) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `cluster`, for example `eu` | No (real time) |
| `UPSTASH_REDIS_REST_URL` | REST URL from step 3 | No (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from step 3 | No (rate limiting) |

Do not set `DATABASE_URL` on Vercel: it is only used locally.

4. Click **Deploy**.

`NEXT_PUBLIC_*` variables are embedded in the browser code at build time. If you add or change them afterwards, trigger a new deployment (**Deployments → ⋯ → Redeploy**) for them to take effect.

## 6. Check the deployment

1. Open the URL provided by Vercel, create a room and add a topic.
2. Open the room link in a private browsing window and join it with another name. Both windows should update each other.
3. In Vercel, **Settings → Cron Jobs** should list `/api/cron/purge` (scheduled at 3 AM UTC, defined in `vercel.json`). To trigger it by hand:

   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-app>.vercel.app/api/cron/purge
   ```

   The expected response is `{"deleted":0}`. Without the right secret, the route answers `401`.

Vercel adds the `Authorization: Bearer $CRON_SECRET` header itself when it calls the scheduled job. On the Hobby plan, a job can run once a day, at any moment within the scheduled hour, which is enough here.

## 7. Deploy production from version tags

Production is not deployed on every push to `main`, only when a version tag (`vX.Y.Z`) is pushed. Two pieces make this work:

- `vercel.json` turns off Vercel's automatic deployments of `main` (`"git": { "deploymentEnabled": { "main": false } }`). Other branches and pull requests still get their preview deployment.
- The GitHub Actions workflow `.github/workflows/deploy.yml` runs on every `v*` tag and deploys it with the Vercel CLI (`vercel deploy --prod`). Vercel builds the sources itself, with the project's environment variables, as for a Git deployment.

The workflow only deploys when the tag is **the highest version**: pushing an older tag (for example to backfill the history) does nothing. It fails, without deploying, if the tag does not point to a commit of `main` or does not match the `version` of `package.json`. If two tags are pushed close together, the newer one cancels the deployment still in progress.

### One-time setup

1. **Create a Vercel token.** On [vercel.com/account/tokens](https://vercel.com/account/tokens), click **Create**, name it `github-actions-virgule`, scope it to the team that owns the project, and pick an expiry date (write it down: deployments stop when it expires). Copy the value, it is shown only once.
2. **Get the project identifiers.** From the project root:

   ```bash
   npx --yes vercel@latest link --yes --scope gobwah40s-projects --project virgule
   ```

   ```bash
   cat .vercel/project.json
   ```

   The file contains `orgId` and `projectId`. The `.vercel` folder is not versioned. Both values are also shown in Vercel: **Team Settings → General → Team ID** and **Project Settings → General → Project ID**.
3. **Add the secrets to GitHub.** In the repository, **Settings → Secrets and variables → Actions → New repository secret**, create:

   | Secret | Value |
   | --- | --- |
   | `VERCEL_TOKEN` | token from step 1 |
   | `VERCEL_ORG_ID` | `orgId` |
   | `VERCEL_PROJECT_ID` | `projectId` |

4. **Check Vercel's Git settings.** In **Project Settings → Git**, the production branch stays `main`. Nothing else to change: `vercel.json` already turns off its automatic deployments.

### Shipping

Once the pull request is merged into `main` (and the migration applied, if any), tag the merge commit and push the tag:

```bash
git switch main && git pull
```

```bash
git tag -a v0.6.0 -m "Virgule 0.6.0" && git push origin v0.6.0
```

Follow the run in the repository's **Actions** tab (**Deploy to production** workflow), then in Vercel under **Deployments**: the deployment appears with the *Production* label.

### Rolling back

Push no new tag for an old version: it would not be the highest one and the workflow would skip it. In Vercel, open the previous production deployment and use **Instant Rollback**, then fix forward with a new version.

## Routine updates

Every version tag pushed to GitHub triggers a production deployment (see step 7). Every branch or pull request gets a preview deployment.

### When the database schema changes

Order matters: the database must be migrated **before** the new code runs.

1. Locally, edit `prisma/schema.prisma`, then generate the migration (for example `pnpm db:migrate --name add-column-x`) and test.
2. Apply the migration on Turso:
   ```bash
   TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" pnpm db:migrate:prod
   ```
3. Merge into `main`, then push the version tag. Vercel deploys the new code.

Prefer migrations compatible with the old code: add an optional column rather than rename or delete. That way, nothing breaks between steps 2 and 3.

**Migrations must be additive.** When SQLite cannot alter a table in place (adding a default value to an existing column, changing a type…), Prisma generates a rebuild: `DROP TABLE` preceded by `PRAGMA foreign_keys=OFF`. But `pnpm db:migrate:prod` applies each migration in a transaction, where SQLite ignores this PRAGMA: the `DROP TABLE` would cascade-delete votes and ideas. The script therefore refuses any migration containing `DROP TABLE` or `foreign_keys=OFF`. In that case, rewrite the migration as `ALTER TABLE … ADD COLUMN` (see `prisma/migrations/20260930091500_sujets_types` for an example).

### Previews and production on the same database

By default, Turso variables apply to every Vercel environment: preview deployments therefore write to the production database. To separate them, create a second database (`turso db create virgule-preview`), migrate it, then, in Vercel, give the `TURSO_*` variables a different value for the *Preview* environment.

## Resetting a database

The **Reset database** workflow (`.github/workflows/reset-db.yml`) deletes every session (participants, topics, ideas, votes) from `virgule-preview` or `virgule`. The schema and the migration history are kept: the app keeps working right away.

**One-time setup.** In the repository, **Settings → Environments**, create two environments, each with the secrets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` of its database:

| Environment | Database |
| --- | --- |
| `preview` | `virgule-preview` |
| `production` | `virgule` |

Then lock them down (already done for this repository):

- **Deployment branches and tags** → **Selected branches**, `main` only, on both: a workflow edited on another branch cannot reach the secrets.
- On `production`, add yourself under **Required reviewers**: the run then waits for an explicit approval.

The workflow itself only runs for the repository owner (`github.triggering_actor == github.repository_owner`): a run started by anyone else is skipped.

**Running it.** **Actions → Reset database → Run workflow**, choose the database, then type its name again in the confirmation field. A mismatch stops the run before anything is deleted.

Locally, the same script runs with the database values (`RESET_CONFIRM=yes` is required):

```bash
(set -a; . ./.env.preview.local; set +a; RESET_CONFIRM=yes pnpm db:reset:remote)
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `no such table: Room` error in Vercel logs | Migrations not applied on Turso | Redo step 2 |
| `401` or `Unauthorized` error from Turso | Invalid or revoked token | `turso db tokens create virgule`, update `TURSO_AUTH_TOKEN`, redeploy |
| The app tries to open `file:./dev.db` in production | `TURSO_DATABASE_URL` missing from the environment concerned | Check the variable for *Production* (and *Preview*) |
| No instant update, but a refresh every ~30 s | Pusher OK in the browser, server-side sending fails | Check `PUSHER_APP_ID` and `PUSHER_SECRET`; logs show `[realtime] notification failed` |
| Updates every 3 s despite Pusher | `NEXT_PUBLIC_PUSHER_*` added after the build | Redeploy |
| A tag was pushed, nothing is deployed | The tag is not the highest version, or the secrets are missing | Read the **Deploy to production** run in the **Actions** tab |
| `Error: The specified token is not valid` in the workflow | `VERCEL_TOKEN` expired or revoked | Create a new token, update the GitHub secret, re-run the workflow |
| The cron deletes nothing | No room older than 7 days, or `CRON_SECRET` missing | Test with the `curl` command from step 6 |

Runtime logs are in Vercel, under **Deployments → (deployment) → Logs** or in the project's **Logs** tab.
