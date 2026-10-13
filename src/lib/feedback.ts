import "server-only";

import { REPO_URL } from "@/lib/config";

// Ideas and bug reports sent from the footer become issues of the public repository. Nobody needs
// a GitHub account: the server creates them with a fine-grained token (Issues: write on this
// repository only). Without `GITHUB_FEEDBACK_TOKEN`, the button is not shown.

export const FEEDBACK_KINDS = ["idea", "bug"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

const LABELS: Record<FeedbackKind, string> = { idea: "enhancement", bug: "bug" };

/** Technical details, attached only when the person agrees. */
export type FeedbackContext = { version: string; path: string; locale: string; userAgent: string };

type Issue = { title: string; body: string; labels: string[] };

export const isFeedbackConfigured = () => Boolean(process.env.GITHUB_FEEDBACK_TOKEN);

/**
 * Page the report was sent from, without what would let a stranger in: the issue is public, and a
 * room slug or a shared recap token is the key to it. Query and hash are dropped too.
 */
export function publicPath(path: string): string {
  const [pathname = ""] = path.split(/[?#]/);
  const segments = pathname.split("/").filter(Boolean).slice(0, 4);
  if (segments[0] === "r" && segments[1]) segments[1] = "[slug]";
  if (segments[0] === "recap" && segments[1]) segments[1] = "[token]";
  return `/${segments.map((segment) => (/^[\w[\]-]{1,40}$/.test(segment) ? segment : "…")).join("/")}`;
}

/** An "@name" in someone's text would notify that GitHub user: the zero-width space prevents it. */
const withoutMentions = (text: string) => text.replace(/@(?=[\w-])/g, "@​");

/** Table cells: no pipe or line break to break the table. */
const cell = (text: string) => text.replace(/[|\r\n]+/g, " ").trim();

export function buildIssue(input: {
  kind: FeedbackKind;
  title: string;
  description: string;
  context?: FeedbackContext;
}): Issue {
  const parts = [withoutMentions(input.description)];
  if (input.context) {
    const { version, path, locale, userAgent } = input.context;
    parts.push(
      [
        "| Details | |",
        "| --- | --- |",
        `| Version | ${cell(version)} |`,
        `| Page | \`${cell(publicPath(path))}\` |`,
        `| Language | ${cell(locale)} |`,
        `| Browser | ${cell(userAgent) || "unknown"} |`,
      ].join("\n"),
    );
  }
  parts.push("<sub>Sent from the feedback form in Virgule.</sub>");
  return { title: withoutMentions(input.title), body: parts.join("\n\n"), labels: [LABELS[input.kind]] };
}

/** `owner/name` of the repository linked from the footer. */
const REPO = new URL(REPO_URL).pathname.slice(1);

/** Creates the issue; throws if GitHub refuses it or does not answer. */
export async function createIssue(issue: Issue): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_FEEDBACK_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(issue),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}: ${await response.text()}`);
}
