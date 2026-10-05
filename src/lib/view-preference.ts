// Layout picked by each person for the session steps: a list, or a board laid out like the room
// screen (topic cards side by side, one column per topic, the recap topic by topic). One choice
// for every step, stored in a cookie readable on both sides, so that the server renders the right
// layout straight away (no jump on load), like the theme.

export const VIEW_COOKIE = "virgule_view";

export type ViewPreference = "list" | "board";

/** Cookie value → layout (anything unrecognised is the list). */
export const parseViewPreference = (value: string | undefined): ViewPreference => (value === "board" ? "board" : "list");
