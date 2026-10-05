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
        // One panel per topic: the columns stay apart on a washed-out projector too.
        <section
          key={topic.id}
          aria-labelledby={`present-topic-${topic.id}`}
          className="flex min-h-0 min-w-0 flex-col gap-[1.2vh] rounded-[1.2em] border-[1.5px] border-border bg-card p-[1em] stage-sm"
        >
          {/* Title on a line of its own, the count under it: never squeezed into breaking a word. */}
          <header className="space-y-[0.2em]">
            <h2 id={`present-topic-${topic.id}`} className="font-heading stage-lg font-bold wrap-break-word hyphens-auto">
              {topic.title}
            </h2>
            <p className="stage-xs text-muted-foreground tabular-nums">{topic.countLabel}</p>
          </header>
          {topic.ideas.length === 0 ? (
            <p className="stage-sm text-muted-foreground">{emptyLabel}</p>
          ) : (
            <ul className="flex min-h-0 flex-col gap-[1vh] lg:flex-1 lg:overflow-hidden lg:[mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
              {[...topic.ideas].reverse().map((idea, i) => (
                <li
                  key={idea.id}
                  className={cn(
                    "shrink-0 rounded-[0.8em] border-[1.5px] bg-background px-[0.9em] py-[0.55em] stage-md font-semibold [overflow-wrap:anywhere]",
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
