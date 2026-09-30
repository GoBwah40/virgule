import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  body: string;
  /** Icon badge above the title. */
  icon?: LucideIcon;
  /** Discreet technical detail (e.g. an error code to pass on). */
  details?: string;
  /** Suggested actions (buttons, links). */
  children?: React.ReactNode;
  /** `full`: fills the page (<main>, <h1>); `section`: sits under an existing header (<div>, <h2>). */
  size?: "full" | "section";
};

/** Status screen (not found, expired, error…): a clear message and an action to move on. */
export function StatusPage({ title, body, icon: Icon, details, children, size = "full" }: Props) {
  // Full page: main landmark and page title. Section: already inside a <main> under an <h1>.
  const Root = size === "full" ? "main" : "div";
  const Heading = size === "full" ? "h1" : "h2";
  return (
    <Root
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center",
        size === "full" ? "flex-1 py-12" : "py-8",
      )}
    >
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-2xl bg-highlight-soft text-primary">
          <Icon className="size-7" aria-hidden />
        </span>
      )}
      <Heading className="text-2xl font-extrabold">{title}</Heading>
      <p className="text-muted-foreground">{body}</p>
      {children && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>}
      {details && <p className="font-mono text-xs text-muted-foreground">{details}</p>}
    </Root>
  );
}
