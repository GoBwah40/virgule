# Ce qu'il reste à faire

État au 30 septembre 2026.

## État de la production

| Élément | Valeur |
| --- | --- |
| URL | https://virgule.vercel.app |
| Projet Vercel | `gobwah40s-projects/virgule`, relié au repo GitHub (chaque push sur `main` déploie) |
| Fonctions serveur | Dublin (`dub1`, voir `vercel.json`) |
| Base de données | Turso `virgule`, Irlande (`aws-eu-west-1`), migration `20260928074451_init` appliquée |
| Purge des séances expirées | Vercel Cron, chaque jour à 3 h UTC (`/api/cron/purge`), testée : répond `401` sans secret, `{"deleted":0}` avec |
| Temps réel | Pusher Channels, cluster `eu` : notification reçue en direct, vérifiée en production le 30 septembre. Repli automatique sur un rafraîchissement toutes les 30 secondes |
| Protection de `main` | Ruleset « main » actif : pull request obligatoire, CI « Lint, types, tests, knip » verte avant fusion, ni suppression ni force-push. Dépôt public |
| Séance de test | « Test de mise en ligne », créée en production pendant la vérification, supprimée automatiquement après 7 jours |

## Variables d'environnement Vercel

Les valeurs sont masquées dans Vercel ; ce tableau indique où chaque variable existe et ce qu'il faut en faire.

| Variable | Production | Preview | État | Action |
| --- | --- | --- | --- | --- |
| `TURSO_DATABASE_URL` | ✅ | ⚠️ | Production : base `virgule`. Preview : ancienne valeur inconnue ; la base `virgule-preview` est prête (voir « Base de prévisualisation »). | Remplacer la valeur Preview. |
| `TURSO_AUTH_TOKEN` | ✅ | ⚠️ | Idem. | Remplacer la valeur Preview. |
| `CRON_SECRET` | ✅ | ⚠️ | Le cron ne tourne qu'en production. | Supprimer la valeur Preview, inutile. |
| `DATABASE_URL` | ⚠️ | ⚠️ | Créée avant la mise en ligne. Ignorée en production (`TURSO_DATABASE_URL` est prioritaire), elle ne sert qu'en local. | Supprimer des deux environnements pour éviter la confusion. |
| `PUSHER_APP_ID` | ✅ | ⏳ | Production : app Pusher `eu`. | Preview : à renseigner si besoin. |
| `PUSHER_SECRET` | ✅ | ⏳ | Idem. | Idem. |
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ | ⏳ | Publique par nature (lue par le navigateur) : type *Config*, pas *Secret*. | Idem. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ | ⏳ | `eu`, type *Config*. | Idem. |

Légende : ✅ en place · ⚠️ à vérifier ou nettoyer · ⏳ à renseigner plus tard.

En local, les valeurs de production sont dans `.env.production.local` et celles de prévisualisation dans `.env.preview.local` (ignorés par git, lisibles par toi seul). Ne les partage pas et ne les committe jamais.

### Nettoyer et compléter les variables

À lancer depuis la racine du projet. Les valeurs passent par l'entrée standard : elles ne s'affichent pas et ne restent pas dans l'historique du terminal.

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

Puis `vercel env ls` pour vérifier : Preview ne doit plus contenir que `TURSO_*` et `PUSHER_*`.

## Avant d'inviter du monde

- [x] **Tester à deux, en local** (30 septembre) : deux navigateurs séparés (`localhost` et `127.0.0.1`, cookies distincts). Arrivée du second participant, passage aux idées suivi automatiquement, idée et vote visibles des deux côtés, doublon refusé, indicateurs de votes à jour.
- [ ] **Tester à deux, depuis un téléphone** : ouvrir une séance en production sur l'ordinateur, la rejoindre depuis un téléphone (scanner le QR code d'invitation), vérifier que tout apparaît des deux côtés en moins de 3 secondes, et essayer le bouton « Partager ».
- [ ] **Nettoyer les variables** signalées ⚠️ ci-dessus : commandes dans « Nettoyer et compléter les variables ».
- [ ] **Vérifier le premier passage du cron** le lendemain : Vercel, *Settings → Cron Jobs*, ou les logs du projet.

## Plus tard

### Pusher (activé le 30 septembre)

Procédure suivie, à refaire pour Preview ou en cas de changement d'app :

1. Créer une app *Channels* sur [pusher.com](https://pusher.com) (offre Sandbox gratuite), cluster `eu`.
2. Dans *App Keys*, relever `app_id`, `key`, `secret` et `cluster`, puis les ajouter dans Vercel (Production, et Preview si besoin), par exemple : `vercel env add PUSHER_SECRET production --force --sensitive` (la valeur est demandée sans s'afficher). Les deux variables `NEXT_PUBLIC_*` sont publiques : Vercel refuse `--sensitive`, utiliser `--no-sensitive`. Les 4 variables : `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`. Les copier aussi dans `.env.local` pour tester en local.
3. Redéployer : *Deployments → ⋯ → Redeploy*. Les variables `NEXT_PUBLIC_*` sont intégrées au moment du build, un simple enregistrement ne suffit pas.
4. Vérifier : les mises à jour deviennent instantanées ; en cas d'échec, les logs affichent `[realtime] échec de notification` et l'app revient au rafraîchissement toutes les 30 secondes.

Aucun changement de code n'est nécessaire.

### Base de prévisualisation

Aujourd'hui, les déploiements de prévisualisation (branches, pull requests) utiliseraient les variables Preview dont la valeur est inconnue. Deux options :

La base séparée `virgule-preview` (Irlande, `aws-eu-west-1`) est créée et toutes les migrations y sont appliquées (30 septembre). Son URL et un jeton sont dans `.env.preview.local`. Il reste à les copier dans les variables Preview de Vercel (voir « Nettoyer et compléter les variables »).

Chaque nouvelle migration s'applique aux deux bases : la production (commande dans « Commandes utiles ») et la prévisualisation :

```bash
(set -a; . ./.env.preview.local; set +a; pnpm db:migrate:prod)
```

### Qualité et exploitation

- [x] **Intégration continue** : `.github/workflows/ci.yml` lance `pnpm check` et le build Storybook à chaque push sur `main` et sur chaque pull request.
- [x] **Rendre la CI obligatoire** (30 septembre, dépôt passé en public) : sur GitHub, *Settings → Rules → Rulesets → New branch ruleset*, cible `main`, cocher « Require status checks to pass » et choisir « Lint, types, tests, knip ». Sans cette règle, la CI signale un problème mais n'empêche pas de fusionner. Attention : sur un dépôt **privé**, ces règles demandent GitHub Pro (ou Team) ; avec l'offre gratuite, il faut soit rendre le dépôt public, soit continuer à vérifier la CI à la main avant de fusionner.
- [ ] **Domaine personnalisé** si besoin : Vercel, *Settings → Domains*.
- [ ] **Rotation du jeton Turso** de temps en temps : `turso db tokens create virgule`, mettre à jour `TURSO_AUTH_TOKEN` dans Vercel et dans `.env.production.local`, redéployer, puis révoquer l'ancien (`turso db tokens invalidate virgule` invalide tous les jetons existants).
- [ ] **Sauvegardes** : vérifier les options de restauration de ton offre Turso.
- [ ] **Mettre à jour la charte** dans `.docs/charte-graphique.html` : ses exemples parlent encore de voyage.

## Limites connues

- Le rôle d'animateur est lié au cookie du navigateur qui a créé la séance : sur un autre appareil ou après effacement des cookies, il est perdu, et il n'existe pas de transfert.
- 6 participants maximum par séance.
- Français uniquement ; la structure i18n est prête (voir « Ajouter une langue » dans le README).

## Commandes utiles

Appliquer une nouvelle migration en production, avec les valeurs de `.env.production.local` :

```bash
(set -a; . ./.env.production.local; set +a; pnpm db:migrate:prod)
```

Consulter les logs de production :

```bash
vercel logs virgule.vercel.app
```

Relancer le cron à la main :

```bash
(set -a; . ./.env.production.local; set +a; curl -H "Authorization: Bearer $CRON_SECRET" https://virgule.vercel.app/api/cron/purge)
```
