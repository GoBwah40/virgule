# Virgule

Application de brainstorming et de planification en petit groupe (6 personnes maximum), sans compte : on partage un lien, chacun donne son prénom, propose des idées et vote.

## Déroulé d'une séance

1. **Thèmes** : le créateur de la room devient l'**animateur**. Il déclare les thèmes et choisit si l'on peut voter sur ses propres idées (activé par défaut).
2. **Idées & votes** : chaque participant propose des idées dans chaque thème et vote **pour** ou **contre**. Les idées et les votes sont **anonymes**. Chacun peut changer son vote jusqu'à la clôture ; les scores ne sont pas visibles pendant le vote.
3. **Récapitulatif** : les idées sont classées par score. L'animateur choisit la règle de qualification (par défaut, *score positif* : plus de « pour » que de « contre » ; sinon, un seul « pour » suffit). Il peut ensuite :
   - **lancer un nouveau tour** : seules les idées retenues restent, les votes sont remis à zéro et on peut proposer de nouvelles idées ;
   - **rouvrir les votes** du tour en cours ;
   - **terminer la séance** : la room passe en lecture seule.

L'animateur pilote les phases, et tous les participants suivent automatiquement. Le récapitulatif garde l'historique de chaque tour et peut être exporté en **Markdown**, en **CSV** (compatible Excel) ou en **PDF** (via l'impression du navigateur).

Une room expire **7 jours** après sa création ; une tâche planifiée quotidienne la supprime ensuite.

## Stack

| Besoin | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| UI | shadcn/ui (base Base UI), Tailwind CSS v4, lucide-react |
| Base de données | Prisma 7 + adapter libSQL : fichier SQLite en local, [Turso](https://turso.tech) en production |
| Temps réel | [Pusher Channels](https://pusher.com/channels) (optionnel), avec repli automatique sur du polling |
| i18n | next-intl (français uniquement pour l'instant) |
| Qualité | Vitest + Testing Library, Storybook 10, ESLint, knip |
| Hébergement | Vercel (+ Vercel Cron pour la purge) |

## Démarrage en local

Prérequis : Node.js 20+ et pnpm.

```bash
pnpm install              # génère aussi le client Prisma
cp .env.example .env      # la config par défaut suffit en local
pnpm db:migrate           # crée dev.db et applique les migrations
pnpm dev                  # http://localhost:3000
```

Pour tester à plusieurs sur la même machine, ouvrez le lien de la room sur `http://localhost:3000` **et** sur `http://127.0.0.1:3000` : ce sont deux origines distinctes, donc deux participants différents. Une fenêtre de navigation privée fonctionne aussi.

### Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Serveur de développement |
| `pnpm build` | `prisma generate` + build de production |
| `pnpm check` | Lint, types, tests et knip : à lancer avant chaque commit |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Tests Vitest : logique (Node) et composants (jsdom) |
| `pnpm knip` | Détecte fichiers, exports et dépendances inutilisés |
| `pnpm storybook` | Catalogue des composants globaux sur http://localhost:6006 |
| `pnpm db:migrate` | Crée ou applique une migration sur la base locale |
| `pnpm db:migrate:prod` | Applique les migrations en attente sur Turso |
| `pnpm db:studio` | Prisma Studio (base locale) |

## Déploiement sur Vercel

La production tourne sur Vercel, avec une base [Turso](https://turso.tech) (SQLite hébergé) : le disque de Vercel est éphémère, un fichier SQLite n'y survivrait pas. Pusher est optionnel.

Le pas-à-pas complet (création de la base, migrations, variables d'environnement, cron, vérifications, dépannage) est dans **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Charte graphique

- **Couleurs** (tokens dans `src/app/globals.css`, mode sombre selon le réglage du système) : papaye `#F26A2E` (marque), papaye brûlée `#C2410C` (actions), mangue `#FFC23D` (mise en avant), sable `#FFF7F0` (fond), encre figue `#2A1A24` (texte). Olivier `#1F7A4D` et grenade `#B8283F` sont réservés aux résultats des votes. Tous les couples texte/fond respectent le contraste AA.
- **Typographies** (`src/app/fonts.ts`) : Bricolage Grotesque pour les titres, Figtree pour le texte, DM Mono pour les lettres de siège.
- **Mobile d'abord** : cibles tactiles de 44 px, une colonne, actions principales en pleine largeur.
- **Ton** : tutoiement, voix du groupe (« on »), prénoms plutôt que rôles, pas d'argot ni d'emoji. Vocabulaire : séance, participants, sujets, idées, bilan ; la personne qui crée la séance « l'anime ».

## Architecture

```
.docs/                      Maquettes et charte graphique (HTML autonomes, voir .docs/README.md)
messages/fr.json            Traductions (toutes les chaînes de l'UI)
prisma/schema.prisma        Modèle : Room, Participant, Theme, Idea, Vote
scripts/migrate-turso.mts   Application des migrations sur Turso
src/
  app/
    page.tsx                Accueil : création d'une room
    r/[slug]/layout.tsx     Garde d'accès (introuvable / expirée / rejoindre) + en-tête + synchro
    r/[slug]/page.tsx       Lien de partage → redirige vers la phase en cours
    r/[slug]/themes|ideas|recap/page.tsx   Une page par phase
    r/[slug]/export/route.ts               Export Markdown / CSV
    api/cron/purge/route.ts                Purge des rooms expirées
  components/*.tsx          Composants globaux réutilisables (+ .stories.tsx et .test.tsx)
  components/ui/            Primitives shadcn/ui (Base UI)
  components/phases/        Assemblage des composants globaux pour chaque phase
  components/room/          En-tête, formulaire d'accès, synchro temps réel
  lib/actions.ts            Toutes les mutations (Server Actions) et leurs contrôles
  lib/room.ts               Lectures : contexte de room, vue de vote, récapitulatif
  lib/results.ts            Règles de score et de qualification (pures, testées)
  lib/export.ts             Formats d'export (purs, testés)
  lib/realtime/             Notification Pusher côté serveur
  i18n/                     Configuration next-intl
```

### Principes

- **Identité sans compte** : rejoindre une room crée un `Participant` avec un token aléatoire, stocké dans un cookie httpOnly propre à la room (valable 7 jours). Revenir avec le même navigateur ne consomme donc pas de nouvelle place. Si l'animateur perd ce cookie (autre appareil, cookies effacés), il perd aussi son rôle.
- **Le serveur fait autorité** : chaque action vérifie la participation, le rôle (animateur ou non) et la phase courante. Le client n'a aucune logique métier critique.
- **Anonymat** : le client ne reçoit jamais l'auteur d'une idée ni les votes des autres, seulement ses propres votes et, au récapitulatif, les totaux.
- **Synchronisation** : après chaque mutation, le serveur envoie via Pusher une notification sans contenu, et les clients rechargent l'état depuis le serveur (`router.refresh()`). Les changements de phase se propagent donc à tout le monde par une simple redirection côté serveur.
- **Tours** : une idée porte son tour de création (`createdRound`) et, le cas échéant, le tour à partir duquel elle est écartée (`eliminatedRound`). Les votes sont enregistrés par tour, ce qui conserve l'historique complet.

### Ajouter une langue

1. Créer `messages/<locale>.json` avec exactement les mêmes clés que `fr.json`. La règle est vérifiée par `src/i18n/messages.test.ts` : une clé présente dans une langue doit exister dans toutes les autres, et aucune traduction ne peut être vide.
2. Ajouter la locale au type `Locale` dans `src/i18n/config.ts`.
3. Déterminer la locale dans `src/i18n/request.ts` (cookie, en-tête `Accept-Language`, etc.) et ajouter éventuellement un sélecteur de langue dans l'UI.
