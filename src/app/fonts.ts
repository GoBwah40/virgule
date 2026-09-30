import { Bricolage_Grotesque, DM_Mono, Figtree } from "next/font/google";

// Brand: Bricolage Grotesque (headings), Figtree (text and UI), DM Mono (seat letters).
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["700", "800"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: "500" });

/** Classes to set on <html> (app) or on the stories container (Storybook). */
export const fontVariables = `${bricolage.variable} ${figtree.variable} ${dmMono.variable}`;
