# Documents de conception

Maquettes et propositions produites pendant la conception de Virgule. Ce sont des pages HTML autonomes : ouvrez-les directement dans un navigateur.

| Fichier | Contenu | Décision prise |
| --- | --- | --- |
| [recap-variantes.html](recap-variantes.html) | Trois variantes de fond pour les idées retenues ou écartées au bilan, et votes en flèches avec score en infobulle. | Variante C (fond à 10 % + bordure teintée), score et détail des votes en infobulle, flèches aussi pour voter. Ensuite : score nul en neutre, votes visibles seulement au survol du statut. |
| [sujets-types-etape-2.html](sujets-types-etape-2.html) | Propositions pour la suite des sujets typés : créneau commun des périodes (frise ou calendrier, trois formulations), budget compatible des fourchettes, types « Lieu » (lien vers la carte) et « Liste » (options fixées par la personne qui anime). | En attente. |
| [charte-graphique.html](charte-graphique.html) | Charte graphique : couleurs, typographies, rangée de sièges, composants, ton et vocabulaire, écrans mobiles. | Tutoiement, vocabulaire planification, rangée de places, sujets suggérés. |

## À savoir

- La charte a été réécrite le 30 septembre 2026 avec le vocabulaire de planification et de brainstorm (séance, participants, « anime la séance »). Les textes de référence restent dans `messages/fr.json`.
- La référence pour le code reste `src/app/globals.css` (tokens), `src/app/fonts.ts` (typographies) et les stories Storybook (`pnpm storybook`).
