"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  labels: { retry: string; home: string };
  /** Reloads the data and re-renders the failed part (Next's `retry`). */
  onRetry: () => void;
  /** Code to share so the error can be found in the server logs. */
  details?: string;
  size?: React.ComponentProps<typeof StatusPage>["size"];
};

/** Error page content: explanation, retry button and link back home. */
export function ErrorFallback({ title, body, labels, onRetry, details, size }: Props) {
  return (
    <StatusPage title={title} body={body} icon={TriangleAlert} details={details} size={size}>
      <Button onClick={onRetry}>
        <RotateCcw data-icon="inline-start" />
        {labels.retry}
      </Button>
      {/* Real <a> link (not <Link>): after an error, a full reload starts from a clean state. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload intended */}
      <Button variant="outline" nativeButton={false} render={<a href="/" />}>
        {labels.home}
      </Button>
    </StatusPage>
  );
}
