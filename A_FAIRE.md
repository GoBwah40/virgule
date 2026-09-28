# Ce qu'il reste à faire

État au 28 septembre 2026, après la première mise en ligne.

## État de la production

| Élément | Valeur |
| --- | --- |
| URL | https://virgule.vercel.app |
| Projet Vercel | `gobwah40s-projects/virgule`, relié au repo GitHub (chaque push sur `main` déploie) |
| Fonctions serveur | Dublin (`dub1`, voir `vercel.json`) |
| Base de données | Turso `virgule`, Irlande (`aws-eu-west-1`), migration `20260928074451_init` appliquée |
| Purge des séances expirées | Vercel Cron, chaque jour à 3 h UTC (`/api/cron/purge`), testée : répond `401` sans secret, `{"deleted":0}` avec |
| Temps réel | Pas de Pusher : les navigateurs se resynchronisent toutes les 3 secondes (vérifié en production) |
| Séance de test | « Test de mise en ligne », créée en production pendant la vérification, supprimée automatiquement après 7 jours |

## Variables d'environnement Vercel

Les valeurs sont masquées dans Vercel ; ce tableau indique où chaque variable existe et ce qu'il faut en faire.

| Variable | Production | Preview | État | Action |
| --- | --- | --- | --- | --- |
| `TURSO_DATABASE_URL` | ✅ | ⚠️ | Production : base `virgule`. Preview : créée avant la mise en ligne, valeur inconnue. | Vérifier la valeur Preview (voir « Base de prévisualisation »). |
| `TURSO_AUTH_TOKEN` | ✅ | ⚠️ | Idem. | Idem. |
| `CRON_SECRET` | ✅ | ⚠️ | Le cron ne tourne qu'en production. | Supprimer la valeur Preview, inutile. |
| `DATABASE_URL` | ⚠️ | ⚠️ | Créée avant la mise en ligne. Ignorée en production (`TURSO_DATABASE_URL` est prioritaire), elle ne sert qu'en local. | Supprimer des deux environnements pour éviter la confusion. |
| `PUSHER_APP_ID` | ⏳ | ⏳ | Existe mais n'est pas utilisée pour l'instant. | À renseigner avec Pusher (voir plus bas). |
| `PUSHER_SECRET` | ⏳ | ⏳ | Idem. | Idem. |
| `NEXT_PUBLIC_PUSHER_KEY` | ⏳ | ⏳ | Vide en production (vérifié : le client Pusher ne se charge pas). | Idem. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ⏳ | ⏳ | Existe mais n'est pas utilisée pour l'instant. | Idem, par exemple `eu`. |

Légende : ✅ en place · ⚠️ à vérifier ou nettoyer · ⏳ à renseigner plus tard.

En local, les valeurs de production sont dans `.env.production.local` (ignoré par git, lisible par toi seul). Ne le partage pas et ne le committe jamais.

## Avant d'inviter du monde

- [ ] **Tester à deux** : ouvrir une séance sur l'ordinateur, la rejoindre depuis un téléphone, vérifier que les idées, les votes et les changements de phase apparaissent des deux côtés en moins de 3 secondes.
- [ ] **Nettoyer les variables** signalées ⚠️ ci-dessus : dans Vercel, *Settings → Environment Variables*.
- [ ] **Vérifier le premier passage du cron** le lendemain : Vercel, *Settings → Cron Jobs*, ou les logs du projet.

## Plus tard

### Activer Pusher (temps réel instantané)

1. Créer une app *Channels* sur [pusher.com](https://pusher.com) (offre Sandbox gratuite), cluster `eu`.
2. Dans Vercel, renseigner les 4 variables `PUSHER_*` et `NEXT_PUBLIC_PUSHER_*` (Production, et Preview si besoin).
3. Redéployer : *Deployments → ⋯ → Redeploy*. Les variables `NEXT_PUBLIC_*` sont intégrées au moment du build, un simple enregistrement ne suffit pas.
4. Vérifier : les mises à jour deviennent instantanées ; en cas d'échec, les logs affichent `[realtime] échec de notification` et l'app revient au rafraîchissement toutes les 30 secondes.

Aucun changement de code n'est nécessaire.

### Base de prévisualisation

Aujourd'hui, les déploiements de prévisualisation (branches, pull requests) utiliseraient les variables Preview dont la valeur est inconnue. Deux options :

- **Base séparée (conseillé)** : `turso db create virgule-preview --location aws-eu-west-1`, lui appliquer les migrations, puis mettre son URL et un jeton dans les variables Preview.
- **Même base que la production** : copier les valeurs de production dans Preview. Plus simple, mais les tests écrivent dans les vraies données.

### Qualité et exploitation

- [ ] **Intégration continue** : une action GitHub qui lance `pnpm check` et `pnpm build-storybook` sur chaque pull request. Rien ne bloque aujourd'hui un push qui casse les tests.
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
