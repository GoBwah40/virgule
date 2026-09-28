import type messages from "../../messages/fr.json";

// Typage des clés de traduction : une clé manquante ou mal orthographiée est une erreur TS.
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
