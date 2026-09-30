// Theme preference: stored in a cookie readable on both sides, so that the server
// renders the right theme straight away (no flash on load).

export const THEME_COOKIE = "virgule_theme";

export type ThemePreference = "system" | "light" | "dark";

/** Cookie value → preference (anything unrecognised follows the system). */
export const parseThemePreference = (value: string | undefined): ThemePreference =>
  value === "light" || value === "dark" ? value : "system";
