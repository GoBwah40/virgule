"use client";

import { useState } from "react";

import { SegmentedControl } from "@/components/segmented-control";
import { dayCoverage } from "@/lib/overview";
import { cn } from "@/lib/utils";

type Period = { start: string; end: string };

type Props = {
  /** Periods kept ("YYYY-MM-DD"). */
  periods: Period[];
  /** Highlighted slot (the most shared). */
  best: Period;
  /** Language of month and day names. */
  locale: string;
  labels: {
    view: string;
    timeline: string;
    calendar: string;
    period: string;
    overlap: string;
    best: string;
    days: string;
  };
  className?: string;
};

type View = "timeline" | "calendar";

// Green intensity by the share of periods covering the day (static classes).
const SHADES = ["bg-muted", "bg-success/20", "bg-success/40", "bg-success/60", "bg-success/85"];
const shade = (count: number, total: number) =>
  count === 0 ? SHADES[0] : SHADES[Math.max(1, Math.ceil((count / total) * (SHADES.length - 1)))];

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const isWeekend = (iso: string) => [0, 6].includes(toDate(iso).getUTCDay());

/**
 * Where the periods kept overlap: a day timeline (one bar per period, then the
 * total) or a calendar of the months involved. Switching between them uses a short transition.
 */
export function DateOverview({ periods, best, locale, labels, className }: Props) {
  const [view, setView] = useState<View>("timeline");
  const days = dayCoverage(periods);
  const inBest = (iso: string) => best.start <= iso && iso <= best.end;

  return (
    <div className={cn("space-y-3", className)}>
      <SegmentedControl
        name={`overview-${best.start}`}
        label={labels.view}
        labelHidden
        options={[
          { value: "timeline", label: labels.timeline },
          { value: "calendar", label: labels.calendar },
        ]}
        value={view}
        onChange={setView}
      />
      {/* New key on each switch: the view fades back in. */}
      <div
        key={view}
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
      >
        {view === "timeline" ? (
          <Timeline days={days} periods={periods} total={periods.length} inBest={inBest} label={labels.days} />
        ) : (
          <Calendar days={days} total={periods.length} inBest={inBest} locale={locale} label={labels.days} />
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-success/50" aria-hidden />
          {labels.period}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-success/85" aria-hidden />
          {labels.overlap}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-card ring-2 ring-foreground ring-inset" aria-hidden />
          {labels.best}
        </li>
      </ul>
    </div>
  );
}

type DayCount = { date: string; count: number };

function Timeline({
  days,
  periods,
  total,
  inBest,
  label,
}: {
  days: DayCount[];
  periods: Period[];
  total: number;
  inBest: (iso: string) => boolean;
  label: string;
}) {
  const columns = { gridTemplateColumns: `repeat(${days.length}, minmax(1.25rem, 1fr))` };
  const index = (iso: string) => days.findIndex((d) => d.date === iso);

  return (
    // Beyond a month, the timeline scrolls in its frame rather than widening the page.
    <div className="overflow-x-auto pb-1" role="img" aria-label={label}>
      <div className="grid min-w-full gap-1 tabular-nums" style={{ width: `max(100%, ${days.length * 1.4}rem)` }}>
        <div className="grid gap-0.5 font-mono text-[10px] text-muted-foreground" style={columns}>
          {days.map((d) => (
            <span key={d.date} className={cn("text-center", isWeekend(d.date) && "text-primary")}>
              {toDate(d.date).getUTCDate()}
            </span>
          ))}
        </div>
        {periods.map((p, i) => (
          <div key={i} className="grid h-5 gap-0.5" style={columns}>
            <span
              className="rounded-md bg-success/50"
              style={{ gridColumn: `${index(p.start) + 1} / ${index(p.end) + 2}` }}
            />
          </div>
        ))}
        <div className="mt-1 grid h-7 gap-0.5" style={columns}>
          {days.map((d) => (
            <span
              key={d.date}
              className={cn("rounded-md", shade(d.count, total), inBest(d.date) && "ring-2 ring-foreground ring-inset")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Calendar({
  days,
  total,
  inBest,
  locale,
  label,
}: {
  days: DayCount[];
  total: number;
  inBest: (iso: string) => boolean;
  locale: string;
  label: string;
}) {
  const counts = new Map(days.map((d) => [d.date, d.count]));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  // Day initials, Monday first (June 7, 2027 is a Monday).
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const initials = Array.from({ length: 7 }, (_, i) => weekday.format(new Date(Date.UTC(2027, 5, 7 + i))));

  return (
    <div className="grid gap-4 sm:grid-cols-2" role="img" aria-label={label}>
      {months.map((month) => {
        const [y, m] = month.split("-").map(Number);
        const first = new Date(Date.UTC(y, m - 1, 1));
        const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const offset = (first.getUTCDay() + 6) % 7;
        return (
          <div key={month} className="space-y-1.5">
            <p className="text-sm font-semibold first-letter:uppercase">{monthName.format(first)}</p>
            <div className="grid grid-cols-7 gap-1 text-center tabular-nums">
              {initials.map((d, i) => (
                <span key={i} className="font-mono text-[10px] text-muted-foreground">
                  {d}
                </span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length }, (_, i) => {
                const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
                const count = counts.get(iso) ?? 0;
                return (
                  <span
                    key={iso}
                    className={cn(
                      "grid aspect-square max-w-full place-items-center rounded-lg text-xs font-semibold",
                      shade(count, total),
                      count / total > 0.6 && "text-success-foreground",
                      count === 0 && "text-muted-foreground",
                      inBest(iso) && "ring-2 ring-foreground ring-inset",
                    )}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
