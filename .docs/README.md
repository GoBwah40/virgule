# Documents de conception

Maquettes et propositions produites pendant la conception de Virgule. Ce sont des pages HTML autonomes : ouvrez-les directement dans un navigateur.

| Fichier | Contenu | Décision prise |
| --- | --- | --- |
| [recap-variantes.html](recap-variantes.html) | Trois variantes de fond pour les idées retenues ou écartées au bilan, et votes en flèches avec score en infobulle. | Variante C (fond à 10 % + bordure teintée), score et détail des votes en infobulle, flèches aussi pour voter. Ensuite : score nul en neutre, votes visibles seulement au survol du statut. |
| [charte-graphique.html](charte-graphique.html) | Charte graphique : couleurs, typographies, rangée de sièges, composants, ton et vocabulaire, écrans mobiles. | Tutoiement, rangée de sièges, sujets suggérés. |

## À savoir

- La charte a été rédigée pour un usage « voyage entre amis ». L'app a ensuite pris un vocabulaire de planification et de brainstorm (séance, participants, « anime la séance », sujets génériques). Les couleurs, typographies, composants et règles de ton restent valables ; seuls les exemples et le vocabulaire de ce document sont datés. Les textes à jour sont dans `messages/fr.json`.
- La référence pour le code reste `src/app/globals.css` (tokens), `src/app/fonts.ts` (typographies) et les stories Storybook (`pnpm storybook`).
