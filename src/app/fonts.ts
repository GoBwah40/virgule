import { Bricolage_Grotesque, DM_Mono, Figtree } from "next/font/google";

// Charte : Bricolage Grotesque (titres), Figtree (texte et interface), DM Mono (lettres de siège).
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["700", "800"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: "500" });

/** Classes à poser sur <html> (app) ou sur le conteneur des stories (Storybook). */
export const fontVariables = `${bricolage.variable} ${figtree.variable} ${dmMono.variable}`;
