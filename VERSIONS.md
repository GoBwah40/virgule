# Versions and release notes

Virgule follows [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`. The live version is the one in `package.json`, shown on the "What's new" button on the home page.

## Numbering a version

Every push to `main` goes to production: **one visible production release = one version**.

| What the version contains | We increment | Example |
| --- | --- | --- |
| At least one **addition** (new feature) | MINOR, PATCH reset to 0 | 0.4.0 → 0.5.0 |
| Only **improvements** or **fixes** | PATCH | 0.4.0 → 0.4.1 |
| Nothing visible (refactoring, tests, CI, documentation) | nothing: no version, no note | |

While we are in `0.x`, the app is considered in its break-in period: a change that breaks a habit (step removed, existing sessions incompatible) stays a MINOR change, clearly flagged in the notes. Moving to **1.0.0** will be decided when the app opens to the general public; from then on, such a change will increment MAJOR.

## Release notes

The [`release-notes/`](release-notes) folder has one subfolder per language, [`en/`](release-notes/en) (reference) and [`fr/`](release-notes/fr), each with one file per category:

| File | Category (en / fr) | What goes in |
| --- | --- | --- |
| `added.md` | Added / Ajouts | What could not be done before |
| `improved.md` | Improved / Améliorations | What works better, faster or more clearly |
| `fixed.md` | Fixed / Corrections | What did not work as intended |

In each file, one section per version, newest at the top, then one line per change:

```markdown
## 0.5.0 — 2026-10-12

- Tiebreak round when several ideas are tied.
```

- The heading follows exactly `## X.Y.Z — YYYY-MM-DD` (production release date). A given version carries the same date in all three files.
- A version only appears in the files where it has something to say; no empty section.
- Everything else in the file (title, introduction) is ignored by the app.
- **Both languages move together**: every version is written in `en/` and in `fr/`, with the same versions, the same dates and the same number of lines per category. Line N of a section in `fr/` translates line N of the same section in `en/`.

The home page reads the files of the current language (`src/lib/release-notes-source.ts`, parsed by `src/lib/release-notes.ts`) and shows them as they are: they are UI copy.

- Write for the people using Virgule, not for the team: what they see or can do, never the name of a component, a table or a library.
- One short sentence per change, starting with what changes, ending with a period.
- Same tone as the app, in each language:
  - English: "you", "we" for the group, a first name or "the person hosting" rather than "the host", no slang or emoji.
  - French: tutoiement, « on » for the group, a first name or « la personne qui anime » rather than « l'animateur », no slang or emoji.

`pnpm check` checks the format, date consistency, that the `package.json` version is the most recent one in the notes, and that `fr/` has the same versions, dates and number of changes as `en/` (`src/lib/release-notes.test.ts`).

## Shipping a version

1. In the branch, choose the number (table above), set it in `package.json` and add the lines in `release-notes/en/` and `release-notes/fr/`.
2. If the version contains a migration: apply it on the preview database (`pnpm db:migrate:preview`).
3. `pnpm check`, then check in local preproduction: `pnpm preprod` (see the README).
4. Apply the migration, if any, in production (see the README), then merge the pull request into `main`.
5. Tag the `main` commit that goes to production:

   ```bash
   git tag -a v0.5.0 -m "Virgule 0.5.0" && git push origin v0.5.0
   ```

If two pull requests ship on the same day, each one gets its own version: the second is based on the first and increments again.

## History

The first versions were reconstructed from the git history:

| Version | Date | Last commit |
| --- | --- | --- |
| 0.1.0 | September 28, 2026 | `1e1d047` |
| 0.2.0 | September 29, 2026 | `c6f4a62` |
| 0.3.0 | September 30, 2026 | `9ee855d` |
| 0.4.0 | September 30, 2026 | merge of the release notes pull request |
| 0.5.0 | September 30, 2026 | same pull request: English and the language picker |

To add the missing tags:

```bash
git tag -a v0.1.0 1e1d047 -m "Virgule 0.1.0" && git tag -a v0.2.0 c6f4a62 -m "Virgule 0.2.0" && git tag -a v0.3.0 9ee855d -m "Virgule 0.3.0" && git push origin v0.1.0 v0.2.0 v0.3.0
```
