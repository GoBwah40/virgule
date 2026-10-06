import { cn } from "@/lib/utils";

type Props = {
  topic: string;
  /** Leading ideas: one, or several when tied; none if nothing was kept. */
  winners: string[];
  /** What the group decided (e.g. "Kept by the group", "Tied for first"). */
  verdict: string;
  /** Ranking, best first: the same totals every participant sees in their recap. */
  ideas: {
    id: string;
    content: string;
    up: number;
    down: number;
    qualified: boolean;
    /** Already formatted (e.g. "4 for, 1 against"). */
    votesLabel: string;
    /** Read by screen readers (e.g. "Kept", "Dropped"). */
    statusLabel: string;
  }[];
  /** Ideas left out of the ranking (e.g. "+ 3 more ideas"). */
  moreLabel?: string;
  /**
   * Points topic: `up` holds each idea's points, and the bars are measured against this total
   * (the leading idea's), with no "against" share.
   */
  pointsMax?: number;
  /** `stage`: the room screen, sized on the window; `page`: the recap "topic by topic", in a card. */
  variant?: "stage" | "page";
  className?: string;
};

/** Characters beyond which the kept idea is set a size down, then two. */
const LONG = 40;
const VERY_LONG = 120;

const STYLES = {
  stage: {
    root: "flex-1 content-center gap-x-[4vw] gap-y-[4vh]",
    column: "space-y-[2vh]",
    // Mango reads well on the always-dark room screen.
    topic: "stage-sm text-highlight",
    winners: "space-y-[1vh]",
    winner: { xl: "stage-xl", lg: "stage-lg", md: "stage-md" },
    verdict: "stage-md",
    verdictAlone: "font-heading stage-lg font-bold",
    ranking: "space-y-[1.5vh]",
    rows: "space-y-[1.8vh]",
    idea: "stage-md",
    votes: "stage-xs",
    more: "stage-xs",
    bar: "h-[0.55em]",
  },
  page: {
    root: "rounded-xl border-[1.5px] bg-card p-6 gap-6",
    column: "space-y-3",
    topic: "text-sm text-primary",
    winners: "space-y-1",
    winner: { xl: "text-5xl", lg: "text-3xl", md: "text-xl" },
    verdict: "text-lg",
    verdictAlone: "font-heading text-2xl font-bold",
    ranking: "space-y-2",
    rows: "space-y-3",
    idea: "text-lg",
    votes: "text-sm",
    more: "text-sm",
    bar: "h-2",
  },
} as const;

/** Recap of one topic: the kept idea in large, then the votes, never who cast them. */
export function PresentationResult({ topic, winners, verdict, ideas, moreLabel, pointsMax, variant = "stage", className }: Props) {
  const s = STYLES[variant];
  // Tied ideas share the space, a long one needs it: a size down, or two, so that they all fit.
  const longest = Math.max(0, ...winners.map((winner) => winner.length));
  const winnerSize = longest > VERY_LONG ? "md" : winners.length > 1 || longest > LONG ? "lg" : "xl";
  return (
    <div className={cn("grid items-center lg:grid-cols-[1.2fr_1fr]", s.root, className)}>
      <div className={cn("min-w-0", s.column)}>
        <h2 className={cn("font-semibold tracking-[0.12em] uppercase wrap-break-word hyphens-auto", s.topic)}>{topic}</h2>
        {winners.length > 0 && (
          <ul className={s.winners}>
            {winners.map((winner) => (
              <li key={winner} className={cn("font-heading font-extrabold [overflow-wrap:anywhere]", s.winner[winnerSize])}>
                {winner}
              </li>
            ))}
          </ul>
        )}
        <p className={cn("text-muted-foreground", winners.length > 0 ? s.verdict : s.verdictAlone)}>{verdict}</p>
      </div>

      {ideas.length > 0 && (
        <div className={cn("min-w-0", s.ranking)}>
          <ol className={s.rows}>
            {ideas.map((idea) => {
              const total = pointsMax !== undefined ? Math.max(pointsMax, idea.up) : idea.up + idea.down;
              return (
                <li key={idea.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-[1em] gap-y-[0.5em]">
                  <span
                    className={cn(
                      "min-w-0 font-heading font-bold [overflow-wrap:anywhere]",
                      s.idea,
                      !idea.qualified && "text-muted-foreground line-through decoration-[0.08em]",
                    )}
                  >
                    {idea.content}
                    <span className="sr-only"> · {idea.statusLabel}</span>
                  </span>
                  <span className={cn("font-mono text-muted-foreground tabular-nums", s.votes)}>{idea.votesLabel}</span>
                  {/* Decorative: the counts next to it carry the information. */}
                  <span className={cn("col-span-2 flex overflow-hidden rounded-full bg-muted", s.bar)} aria-hidden>
                    {total > 0 && (
                      <>
                        <span className="bg-success" style={{ width: `${(idea.up / total) * 100}%` }} />
                        {pointsMax === undefined && (
                          <span className="bg-destructive" style={{ width: `${(idea.down / total) * 100}%` }} />
                        )}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          {moreLabel && <p className={cn("text-muted-foreground", s.more)}>{moreLabel}</p>}
        </div>
      )}
    </div>
  );
}
