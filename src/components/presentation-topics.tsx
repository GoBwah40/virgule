import { cn } from "@/lib/utils";

type Props = {
  /** Heading (e.g. "What we need to decide"). */
  title: string;
  topics: { id: string; title: string; description?: string | null; kindLabel?: string }[];
  className?: string;
};

/** The topics of the session on the room screen, one card each. */
export function PresentationTopics({ title, topics, className }: Props) {
  return (
    <section className={cn("flex flex-1 flex-col justify-center gap-[3vh]", className)}>
      <h2 className="font-heading stage-lg font-bold">{title}</h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-[1.5vw]">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className="min-w-0 space-y-[0.5em] rounded-[1.2em] border-[1.5px] bg-card p-[1.2em] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          >
            {topic.kindLabel && (
              <p className="stage-xs font-semibold tracking-[0.1em] text-highlight uppercase">{topic.kindLabel}</p>
            )}
            <h3 className="font-heading stage-lg font-bold [overflow-wrap:anywhere]">{topic.title}</h3>
            {topic.description && <p className="stage-sm text-muted-foreground [overflow-wrap:anywhere]">{topic.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
