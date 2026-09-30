# Design documents

Mockups and proposals produced while designing Virgule. They are standalone HTML pages: open them directly in a browser.

| File | Content | Decision made |
| --- | --- | --- |
| [recap-variants.html](recap-variants.html) | Three background variants for kept or dropped ideas in the recap, and arrow votes with the score in a tooltip. | Variant C (10% background + tinted border), score and vote details in a tooltip, arrows for voting too. Then: zero score shown as neutral, votes visible only when hovering the status. |
| [typed-topics-step-2.html](typed-topics-step-2.html) | Proposals for the next step of typed topics: common slot of the periods (timeline or calendar, three wordings), compatible budget of the ranges, "Place" (link to the map) and "List" (options set by the host) types. | "Common slot: …" wording; timeline and calendar with an animated switch; map link opens the installed app; "Allow other suggestions" off by default. Implemented. |
| [brand-guidelines.html](brand-guidelines.html) | Brand guidelines: colors, typography, row of seats, components, tone and vocabulary, mobile screens. | Informal "you", planning vocabulary, row of seats, suggested topics. |

## Good to know

- The guidelines were rewritten on September 30, 2026 with the planning and brainstorming vocabulary (session, participants, "is hosting"). The reference copy lives in `messages/*.json`.
- The reference for the code remains `src/app/globals.css` (tokens), `src/app/fonts.ts` (typography) and the Storybook stories (`pnpm storybook`).
- The mockups were originally written in French and translated to English; the product decisions they record were made on the French copy.
