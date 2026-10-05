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
  className?: string;
};

/** Characters beyond which the kept idea is set a size down, then two. */
const LONG = 40;
const VERY_LONG = 120;

/** Recap of one topic on the room screen: the kept idea in large, then the votes, never who cast them. */
export function PresentationResult({ topic, winners, verdict, ideas, moreLabel, className }: Props) {
  // Tied ideas share the space, a long one needs it: a size down, or two, so that they all fit.
  const longest = Math.max(0, ...winners.map((winner) => winner.length));
  const winnerSize = longest > VERY_LONG ? "stage-md" : winners.length > 1 || longest > LONG ? "stage-lg" : "stage-xl";
  return (
    <div className={cn("grid flex-1 content-center items-center gap-x-[4vw] gap-y-[4vh] lg:grid-cols-[1.2fr_1fr]", className)}>
      <div className="min-w-0 space-y-[2vh]">
        <h2 className="stage-sm font-semibold tracking-[0.12em] text-highlight uppercase [overflow-wrap:anywhere]">{topic}</h2>
        {winners.length > 0 && (
          <ul className="space-y-[1vh]">
            {winners.map((winner) => (
              <li key={winner} className={cn("font-heading font-extrabold [overflow-wrap:anywhere]", winnerSize)}>
                {winner}
              </li>
            ))}
          </ul>
        )}
        <p className={cn("text-muted-foreground", winners.length > 0 ? "stage-md" : "font-heading stage-lg font-bold")}>{verdict}</p>
      </div>

      {ideas.length > 0 && (
        <div className="min-w-0 space-y-[1.5vh]">
          <ol className="space-y-[1.8vh]">
            {ideas.map((idea) => {
              const total = idea.up + idea.down;
              return (
                <li key={idea.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-[1em] gap-y-[0.5em]">
                  <span
                    className={cn(
                      "min-w-0 font-heading stage-md font-bold [overflow-wrap:anywhere]",
                      !idea.qualified && "text-muted-foreground line-through decoration-[0.08em]",
                    )}
                  >
                    {idea.content}
                    <span className="sr-only"> · {idea.statusLabel}</span>
                  </span>
                  <span className="font-mono stage-xs text-muted-foreground tabular-nums">{idea.votesLabel}</span>
                  {/* Decorative: the counts next to it carry the information. */}
                  <span className="col-span-2 flex h-[0.55em] overflow-hidden rounded-full bg-muted" aria-hidden>
                    {total > 0 && (
                      <>
                        <span className="bg-success" style={{ width: `${(idea.up / total) * 100}%` }} />
                        <span className="bg-destructive" style={{ width: `${(idea.down / total) * 100}%` }} />
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          {moreLabel && <p className="stage-xs text-muted-foreground">{moreLabel}</p>}
        </div>
      )}
    </div>
  );
}
