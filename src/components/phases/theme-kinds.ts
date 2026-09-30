import { CalendarDays, CalendarRange, Coins, Euro, List, MapPin, Type, type LucideIcon } from "lucide-react";

import type { ThemeKind } from "@/lib/idea-value";

/** Icône de chaque type de réponse (sélecteur, badges des sujets). */
export const THEME_KIND_ICONS: Record<ThemeKind, LucideIcon> = {
  TEXT: Type,
  DATE: CalendarDays,
  DATE_RANGE: CalendarRange,
  AMOUNT: Euro,
  AMOUNT_RANGE: Coins,
  PLACE: MapPin,
  CHOICE: List,
};
