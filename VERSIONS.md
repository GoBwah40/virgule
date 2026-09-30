# Versions et notes de version

Virgule suit le [versionnage sémantique](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. La version en ligne est celle de `package.json`, affichée sur le bouton « Nouveautés » de l'accueil.

## Numéroter une version

Chaque push sur `main` part en production : **une mise en production visible = une version**.

| Ce que la version contient | On incrémente | Exemple |
| --- | --- | --- |
| Au moins un **ajout** (nouvelle fonctionnalité) | MINEUR, CORRECTIF remis à 0 | 0.4.0 → 0.5.0 |
| Seulement des **améliorations** ou des **corrections** | CORRECTIF | 0.4.0 → 0.4.1 |
| Rien de visible (refactorisation, tests, CI, documentation) | rien : pas de version, pas de note | |

Tant qu'on est en `0.x`, l'app est considérée en rodage : un changement qui casse une habitude (étape supprimée, séances existantes incompatibles) reste un changement MINEUR, signalé clairement dans les notes. Le passage en **1.0.0** se décidera à l'ouverture au grand public ; à partir de là, un tel changement incrémentera MAJEUR.

## Notes de version

Le dossier [`release-notes/`](release-notes) contient un fichier par catégorie :

| Fichier | Catégorie | On y met |
| --- | --- | --- |
| `ajouts.md` | Ajouts | Ce qu'on ne pouvait pas faire avant |
| `ameliorations.md` | Améliorations | Ce qui marche mieux, plus vite ou plus clairement |
| `corrections.md` | Corrections | Ce qui ne marchait pas comme prévu |

Dans chaque fichier, une section par version, la plus récente en haut, puis une ligne par changement :

```markdown
## 0.5.0 — 2026-10-12

- Tour de départage quand plusieurs idées sont à égalité.
```

- Le titre suit exactement `## X.Y.Z — AAAA-MM-JJ` (date de mise en production). Une même version porte la même date dans les trois fichiers.
- Une version n'apparaît que dans les fichiers où elle a quelque chose à dire ; pas de section vide.
- Tout le reste du fichier (titre, introduction) est ignoré par l'app.

L'accueil lit ces fichiers (`src/lib/release-notes.ts`) et les affiche tels quels : ce sont des textes d'interface.

- Écrire pour les personnes qui utilisent Virgule, pas pour l'équipe : ce qu'elles voient ou peuvent faire, jamais le nom d'un composant, d'une table ou d'une bibliothèque.
- Une phrase courte par changement, qui commence par ce qui change, avec un point final.
- Même ton que l'app : « on » pour le groupe, prénom ou « la personne qui anime » plutôt que « l'animateur », pas d'argot ni d'emoji.

`pnpm check` vérifie le format, la cohérence des dates et que la version de `package.json` est bien la plus récente des notes (`src/lib/release-notes.test.ts`).

## Livrer une version

1. Dans la branche, choisir le numéro (tableau ci-dessus), le reporter dans `package.json` et ajouter les lignes dans `release-notes/`.
2. Si la version contient une migration : l'appliquer sur la base de prévisualisation (`pnpm db:migrate:preview`).
3. `pnpm check`, puis vérifier en préproduction locale : `pnpm preprod` (voir le README).
4. Appliquer la migration éventuelle en production (voir le README), puis fusionner la pull request dans `main`.
5. Poser le tag sur le commit de `main` qui part en production :

   ```bash
   git tag -a v0.5.0 -m "Virgule 0.5.0" && git push origin v0.5.0
   ```

Si deux pull requests partent le même jour, chacune a sa version : la seconde se base sur la première et incrémente à nouveau.

## Historique

Les premières versions ont été reconstituées à partir de l'historique git :

| Version | Date | Dernier commit |
| --- | --- | --- |
| 0.1.0 | 28 septembre 2026 | `1e1d047` |
| 0.2.0 | 29 septembre 2026 | `c6f4a62` |
| 0.3.0 | 30 septembre 2026 | `9ee855d` |
| 0.4.0 | 30 septembre 2026 | fusion de la pull request des notes de version |

Pour poser les tags manquants :

```bash
git tag -a v0.1.0 1e1d047 -m "Virgule 0.1.0" && git tag -a v0.2.0 c6f4a62 -m "Virgule 0.2.0" && git tag -a v0.3.0 9ee855d -m "Virgule 0.3.0" && git push origin v0.1.0 v0.2.0 v0.3.0
```
