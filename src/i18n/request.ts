import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "@/i18n/config";

// Application en français uniquement pour l'instant : pas de routage par langue.
// Pour ajouter une langue : créer messages/<locale>.json, l'ajouter à `locales`,
// puis déterminer la locale ici (cookie, en-tête Accept-Language…).
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    // Fuseau fixe : évite les écarts d'affichage des dates entre serveur (UTC) et navigateur.
    timeZone: "Europe/Paris",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
