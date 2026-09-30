import { CalendarDays, CalendarRange, Coins, Euro, List, MapPin, Type, type LucideIcon } from "lucide-react";

import type { ThemeKind } from "@/lib/idea-value";

/** Icon of each answer kind (picker, topic badges). */
export const THEME_KIND_ICONS: Record<ThemeKind, LucideIcon> = {
  TEXT: Type,
  DATE: CalendarDays,
  DATE_RANGE: CalendarRange,
  AMOUNT: Euro,
  AMOUNT_RANGE: Coins,
  PLACE: MapPin,
  CHOICE: List,
};
