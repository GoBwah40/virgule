import { cn } from "@/lib/utils";

type Props = {
  /** Session name, in very large type. */
  title: string;
  /** What happens now (e.g. "Sam is preparing the topics. Scan the code to join."). */
  note: string;
  /** The code to join (PresentationJoin). */
  join: React.ReactNode;
  className?: string;
};

/** Characters beyond which the name is set a size down. */
const LONG_TITLE = 32;

/** Waiting screen: the session name, what happens now, and the code to join, side by side. */
export function PresentationLobby({ title, note, join, className }: Props) {
  return (
    <div className={cn("grid flex-1 content-center items-center gap-[4vw] md:grid-cols-[1.25fr_1fr]", className)}>
      <div className="min-w-0 space-y-[2.5vh]">
        {/* The page heading (PresentationScreen) already carries the name for screen readers. */}
        <p
          aria-hidden
          // A long name a size down: it still fits beside the code.
          className={cn("font-heading font-extrabold [overflow-wrap:anywhere]", title.length > LONG_TITLE ? "stage-lg" : "stage-xl")}
        >
          {title}
        </p>
        <p className="stage-md text-muted-foreground [overflow-wrap:anywhere]">{note}</p>
      </div>
      <div className="justify-self-center md:justify-self-end">{join}</div>
    </div>
  );
}
