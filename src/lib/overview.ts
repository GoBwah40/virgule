// Synthèse du bilan pour les sujets « Période » et « Fourchette » (fonctions pures,
// testées dans overview.test.ts) : où les propositions retenues se recoupent-elles ?

/** Zone partagée par le plus de propositions : commune à toutes si `count === total`. */
export type Overlap<T> = { start: T; end: T; count: number; total: number };

const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Nombre de périodes couvrant chaque jour, du premier au dernier jour concerné. */
export function dayCoverage(periods: { start: string; end: string }[]): { date: string; count: number }[] {
  if (periods.length === 0) return [];
  const spans = periods.map((p) => [toTime(p.start), toTime(p.end)] as const);
  const first = Math.min(...spans.map(([a]) => a));
  const last = Math.max(...spans.map(([, b]) => b));
  const days: { date: string; count: number }[] = [];
  for (let t = first; t <= last; t += DAY) {
    days.push({ date: toIso(t), count: spans.filter(([a, b]) => a <= t && t <= b).length });
  }
  return days;
}

/**
 * Créneau partagé par le plus de périodes. À égalité, le plus long, puis le plus tôt.
 * Moins de deux périodes : pas de synthèse (null).
 */
export function bestDateOverlap(periods: { start: string; end: string }[]): Overlap<string> | null {
  if (periods.length < 2) return null;
  const days = dayCoverage(periods);
  const max = Math.max(...days.map((d) => d.count));
  let best: { start: number; end: number } | null = null;
  let run: { start: number; end: number } | null = null;
  days.forEach((day, i) => {
    run = day.count === max ? { start: run?.start ?? i, end: i } : null;
    if (run && (!best || run.end - run.start > best.end - best.start)) best = { ...run };
  });
  const { start, end } = best!;
  return { start: days[start].date, end: days[end].date, count: max, total: periods.length };
}

/**
 * Fourchette partagée par le plus de fourchettes. À égalité, la plus large, puis la plus basse.
 * Moins de deux fourchettes : pas de synthèse (null).
 */
export function bestAmountOverlap(ranges: { min: number; max: number }[]): Overlap<number> | null {
  if (ranges.length < 2) return null;
  const bounds = [...new Set(ranges.flatMap((r) => [r.min, r.max]))].sort((a, b) => a - b);
  let best: Overlap<number> | null = null;
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i; j < bounds.length; j++) {
      const [start, end] = [bounds[i], bounds[j]];
      const count = ranges.filter((r) => r.min <= start && end <= r.max).length;
      if (!best || count > best.count || (count === best.count && end - start > best.end - best.start)) {
        best = { start, end, count, total: ranges.length };
      }
    }
  }
  return best;
}
