# Déployer Virgule sur Vercel avec Turso

Ce guide part du dépôt GitHub `GoBwah40/virgule` et aboutit à une app en ligne, avec une base Turso et, en option, du temps réel avec Pusher. Comptez une vingtaine de minutes la première fois.

## Pourquoi Turso ?

Sur Vercel, le code tourne dans des fonctions serverless dont le disque est éphémère et en lecture seule. Un fichier SQLite y serait perdu à chaque déploiement, voire à chaque requête. Turso héberge une base SQLite (libSQL) accessible par le réseau. L'app utilise le même adapter Prisma libSQL en local et en production (`src/lib/db.ts`) :

| Environnement | Base | Variables lues |
| --- | --- | --- |
| Local | fichier `dev.db` | `DATABASE_URL` |
| Production | Turso | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (prioritaires) |

L'offre gratuite de Turso suffit largement pour cet usage.

## Prérequis

- Un compte [GitHub](https://github.com) avec le dépôt poussé.
- Un compte [Vercel](https://vercel.com) (offre Hobby gratuite) relié à GitHub.
- Un compte [Turso](https://turso.tech) (offre gratuite).
- Sur votre poste : Node.js 20+, pnpm, et le projet installé (`pnpm install`).

## 1. Créer la base Turso

Installez la CLI Turso, puis connectez-vous :

```bash
brew install tursodatabase/tap/turso
```

```bash
turso auth login
```

Sans Homebrew, utilisez `curl -sSfL https://get.tur.so/install.sh | bash`. Pour créer un compte depuis la CLI, lancez `turso auth signup`.

Créez la base :

```bash
turso db create virgule
```

Récupérez son URL. Elle commence par `libsql://` :

```bash
turso db show virgule --url
```

Créez un jeton d'accès :

```bash
turso db tokens create virgule
```

Notez les deux valeurs : ce sont `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN`. Le jeton donne un accès complet à la base, ne le committez jamais.

## 2. Créer les tables (migrations)

Les migrations Prisma (`prisma/migrations/`) sont appliquées sur Turso par le script `scripts/migrate-turso.mts`, pas par `prisma migrate deploy`. Depuis la racine du projet :

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" pnpm db:migrate:prod
```

Le script affiche `✔ 1 migration(s) appliquée(s).` Il retient ce qui a déjà été appliqué dans la table `_virgule_migrations` : le relancer ne fait rien si la base est à jour.

Pour vérifier le résultat, affichez les tables. Vous devez voir `Room`, `Participant`, `Theme`, `Idea`, `Vote` et `_virgule_migrations` :

```bash
turso db shell virgule ".tables"
```

## 3. (Optionnel) Configurer Pusher pour le temps réel

Sans Pusher, chaque navigateur se resynchronise toutes les 3 secondes, ce qui convient pour 6 personnes. Avec Pusher, les mises à jour sont instantanées.

1. Créez un compte sur [pusher.com](https://pusher.com), puis une app **Channels**. L'offre *Sandbox* est gratuite : 200 000 messages par jour, 100 connexions simultanées.
2. Choisissez le cluster le plus proche de vos utilisateurs, par exemple `eu`.
3. Dans l'onglet **App Keys**, relevez `app_id`, `key`, `secret` et `cluster`.

Les messages envoyés à Pusher ne contiennent aucune donnée : ils signalent seulement aux navigateurs qu'il faut recharger l'état depuis le serveur.

## 4. Générer le secret du cron

Une tâche planifiée supprime chaque nuit les rooms expirées (7 jours). Elle est protégée par un secret :

```bash
openssl rand -hex 32
```

Notez la valeur : ce sera `CRON_SECRET`.

## 5. Importer le projet dans Vercel

1. Sur [vercel.com/new](https://vercel.com/new), importez le dépôt `GoBwah40/virgule`.
2. Vercel détecte **Next.js** et **pnpm** (champ `packageManager` du `package.json`). Laissez les réglages de build par défaut. La commande `pnpm build` exécute `prisma generate && next build`, et le client Prisma est aussi généré au `postinstall`.
3. Avant de cliquer sur **Deploy**, ouvrez **Environment Variables** et ajoutez :

| Variable | Valeur | Obligatoire |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | URL `libsql://…` de l'étape 1 | Oui |
| `TURSO_AUTH_TOKEN` | jeton de l'étape 1 | Oui |
| `CRON_SECRET` | valeur de l'étape 4 | Oui |
| `PUSHER_APP_ID` | `app_id` | Non (temps réel) |
| `PUSHER_SECRET` | `secret` | Non (temps réel) |
| `NEXT_PUBLIC_PUSHER_KEY` | `key` | Non (temps réel) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `cluster`, par exemple `eu` | Non (temps réel) |

Ne définissez pas `DATABASE_URL` sur Vercel : elle ne sert qu'en local.

4. Cliquez sur **Deploy**.

Les variables `NEXT_PUBLIC_*` sont intégrées au code du navigateur au moment du build. Si vous les ajoutez ou les modifiez après coup, relancez un déploiement (**Deployments → ⋯ → Redeploy**) pour qu'elles soient prises en compte.

## 6. Vérifier le déploiement

1. Ouvrez l'URL fournie par Vercel, créez une room et ajoutez un thème.
2. Ouvrez le lien de la room dans une fenêtre de navigation privée et rejoignez-la avec un autre pseudo. Les deux fenêtres doivent se mettre à jour mutuellement.
3. Dans Vercel, **Settings → Cron Jobs** doit lister `/api/cron/purge` (planifié à 3 h UTC, défini dans `vercel.json`). Pour le déclencher à la main :

   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://<votre-app>.vercel.app/api/cron/purge
   ```

   La réponse attendue est `{"deleted":0}`. Sans le bon secret, la route répond `401`.

Vercel ajoute lui-même l'en-tête `Authorization: Bearer $CRON_SECRET` quand il appelle la tâche planifiée. Sur l'offre Hobby, une tâche peut s'exécuter une fois par jour, à un moment quelconque dans l'heure prévue, ce qui suffit ici.

## Mises à jour courantes

Chaque `git push` sur `main` déclenche un déploiement de production. Chaque branche ou pull request obtient un déploiement de prévisualisation.

### Quand le schéma de base change

L'ordre compte : la base doit être migrée **avant** que le nouveau code ne tourne.

1. En local, modifiez `prisma/schema.prisma`, puis générez la migration (par exemple `pnpm db:migrate --name ajout-colonne-x`) et testez.
2. Appliquez la migration sur Turso :
   ```bash
   TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" pnpm db:migrate:prod
   ```
3. Committez et poussez. Vercel déploie le nouveau code.

Préférez des migrations compatibles avec l'ancien code : ajouter une colonne facultative plutôt que renommer ou supprimer. Ainsi, rien ne casse entre les étapes 2 et 3.

### Prévisualisations et production sur la même base

Par défaut, les variables Turso s'appliquent à tous les environnements Vercel : les déploiements de prévisualisation écrivent donc dans la base de production. Pour les séparer, créez une seconde base (`turso db create virgule-preview`), migrez-la, puis, dans Vercel, donnez aux variables `TURSO_*` une valeur différente pour l'environnement *Preview*.

## Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Erreur `no such table: Room` dans les logs Vercel | Migrations non appliquées sur Turso | Refaire l'étape 2 |
| Erreur `401` ou `Unauthorized` venant de Turso | Jeton invalide ou révoqué | `turso db tokens create virgule`, mettre à jour `TURSO_AUTH_TOKEN`, redéployer |
| L'app tente d'ouvrir `file:./dev.db` en production | `TURSO_DATABASE_URL` absente de l'environnement concerné | Vérifier la variable pour *Production* (et *Preview*) |
| Pas de mise à jour instantanée, mais un rafraîchissement toutes les ~30 s | Pusher côté navigateur OK, envoi côté serveur en échec | Vérifier `PUSHER_APP_ID` et `PUSHER_SECRET` ; les logs affichent `[realtime] échec de notification` |
| Mise à jour toutes les 3 s malgré Pusher | `NEXT_PUBLIC_PUSHER_*` ajoutées après le build | Redéployer |
| Le cron ne supprime rien | Aucune room de plus de 7 jours, ou `CRON_SECRET` absente | Tester avec la commande `curl` de l'étape 6 |

Les logs d'exécution sont dans Vercel, sous **Deployments → (déploiement) → Logs** ou dans l'onglet **Logs** du projet.
