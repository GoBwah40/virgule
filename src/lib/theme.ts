// Préférence de thème : stockée dans un cookie lisible des deux côtés, pour que le
// serveur rende directement le bon thème (pas de flash au chargement).

export const THEME_COOKIE = "virgule_theme";

export type ThemePreference = "system" | "light" | "dark";

/** Valeur du cookie → préférence (tout ce qui n'est pas reconnu suit le système). */
export const parseThemePreference = (value: string | undefined): ThemePreference =>
  value === "light" || value === "dark" ? value : "system";
