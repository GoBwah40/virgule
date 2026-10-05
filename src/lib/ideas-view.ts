// Ideas page layout chosen by each person: stored in a cookie readable on both sides, so that the
// server renders the right layout straight away (no jump on load), like the theme.

export const IDEAS_VIEW_COOKIE = "virgule_ideas_view";

export type IdeasView = "list" | "board";

/** Cookie value → layout (anything unrecognised is the list). */
export const parseIdeasView = (value: string | undefined): IdeasView => (value === "board" ? "board" : "list");
