import { cn } from "@/lib/utils";

type Props = {
  topics: {
    id: string;
    title: string;
    /** Already formatted (e.g. "3 ideas"). */
    countLabel: string;
    /** Oldest first, as suggested. */
    ideas: { id: string; content: string }[];
  }[];
  /** Shown in a topic with no ideas yet. */
  emptyLabel: string;
  className?: string;
};

/**
 * Ideas arriving live, one column per topic: the latest on top, outlined, the older ones moving
 * down. Text only: never whose idea it is, nor any vote. On a large screen the page does not
 * scroll, the oldest ideas fade out at the bottom of their column.
 */
export function PresentationIdeas({ topics, emptyLabel, className }: Props) {
  return (
    <div
      className={cn(
        "grid flex-1 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-[1.5vw] lg:min-h-0 lg:auto-rows-[minmax(0,1fr)]",
        className,
      )}
    >
      {topics.map((topic) => (
        <section key={topic.id} aria-labelledby={`present-topic-${topic.id}`} className="flex min-h-0 min-w-0 flex-col gap-[1.2vh]">
          <header className="flex items-baseline justify-between gap-3">
            <h2 id={`present-topic-${topic.id}`} className="min-w-0 font-heading stage-lg font-bold [overflow-wrap:anywhere]">
              {topic.title}
            </h2>
            <span className="shrink-0 stage-xs text-muted-foreground tabular-nums">{topic.countLabel}</span>
          </header>
          {topic.ideas.length === 0 ? (
            <p className="stage-sm text-muted-foreground">{emptyLabel}</p>
          ) : (
            <ul className="flex min-h-0 flex-col gap-[1vh] lg:flex-1 lg:overflow-hidden lg:[mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
              {[...topic.ideas].reverse().map((idea, i) => (
                <li
                  key={idea.id}
                  className={cn(
                    "shrink-0 rounded-[0.8em] border-[1.5px] bg-card px-[0.9em] py-[0.55em] stage-md font-semibold [overflow-wrap:anywhere]",
                    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300",
                    i === 0 ? "border-highlight" : "border-border",
                  )}
                >
                  {idea.content}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
