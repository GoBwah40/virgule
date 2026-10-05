import { cn } from "@/lib/utils";

type Props = {
  seats: { id: string; name: string }[];
  /** Total number of seats. */
  capacity: number;
  /** Already formatted (e.g. "4 seats out of 6 taken"). */
  label: string;
  className?: string;
};

/** Seats of the session on the room screen: an initial per person, free seats dashed. */
export function PresentationSeats({ seats, capacity, label, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-[1em] gap-y-2 stage-sm", className)}>
      <p className="text-muted-foreground">{label}</p>
      <ul className="flex flex-wrap gap-[0.4em]">
        {Array.from({ length: capacity }, (_, i) => {
          const seat = seats[i];
          return seat ? (
            <li
              key={seat.id}
              className="grid size-[2.2em] place-items-center rounded-full bg-highlight font-mono font-medium text-background motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-75 motion-safe:duration-300"
            >
              <span aria-hidden>{seat.name.charAt(0).toUpperCase()}</span>
              <span className="sr-only">{seat.name}</span>
            </li>
          ) : (
            <li key={`free-${i}`} aria-hidden className="size-[2.2em] rounded-full border-[0.12em] border-dashed border-muted-foreground/70" />
          );
        })}
      </ul>
    </div>
  );
}
