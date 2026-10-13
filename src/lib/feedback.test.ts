import { afterEach, describe, expect, it, vi } from "vitest";

import { buildIssue, createIssue, isFeedbackConfigured, publicPath } from "./feedback";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const context = { version: "0.21.0", path: "/r/abc234defg/ideas", locale: "fr", userAgent: "Mozilla/5.0 (iPhone)" };

describe("publicPath", () => {
  it("hides the room slug and the shared recap token", () => {
    expect(publicPath("/r/abc234defg/ideas")).toBe("/r/[slug]/ideas");
    expect(publicPath("/recap/s3cr3t-T0ken_x")).toBe("/recap/[token]");
  });

  it("drops the query and the hash", () => {
    expect(publicPath("/r/abc234defg/recap?round=2#top")).toBe("/r/[slug]/recap");
    expect(publicPath("/?x=1")).toBe("/");
  });

  it("masks unexpected segments and keeps the path short", () => {
    expect(publicPath("/<script>/a/b/c/d/e")).toBe("/…/a/b/c");
  });
});

describe("buildIssue", () => {
  it("labels ideas and bugs", () => {
    expect(buildIssue({ kind: "idea", title: "T", description: "D" }).labels).toEqual(["enhancement"]);
    expect(buildIssue({ kind: "bug", title: "T", description: "D" }).labels).toEqual(["bug"]);
  });

  it("attaches the technical details only when given, without the slug", () => {
    expect(buildIssue({ kind: "bug", title: "T", description: "D" }).body).not.toContain("Version");
    const { body } = buildIssue({ kind: "bug", title: "T", description: "It breaks", context });
    expect(body).toContain("It breaks");
    expect(body).toContain("| Version | 0.21.0 |");
    expect(body).toContain("`/r/[slug]/ideas`");
    expect(body).toContain("| Language | fr |");
    expect(body).not.toContain("abc234defg");
  });

  it("keeps a browser string from breaking the table", () => {
    const { body } = buildIssue({ kind: "bug", title: "T", description: "D", context: { ...context, userAgent: "a|b\nc" } });
    expect(body).toContain("| Browser | a b c |");
  });

  it("does not notify GitHub users mentioned in the text", () => {
    const issue = buildIssue({ kind: "idea", title: "Ask @octocat", description: "cc @someone, mail me@x" });
    expect(issue.title).not.toMatch(/@o/);
    expect(issue.body).not.toMatch(/@s/);
  });
});

describe("createIssue", () => {
  it("is configured by its token", () => {
    vi.stubEnv("GITHUB_FEEDBACK_TOKEN", "");
    expect(isFeedbackConfigured()).toBe(false);
    vi.stubEnv("GITHUB_FEEDBACK_TOKEN", "github_pat_x");
    expect(isFeedbackConfigured()).toBe(true);
  });

  it("posts the issue to the repository with the token", async () => {
    vi.stubEnv("GITHUB_FEEDBACK_TOKEN", "github_pat_x");
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetch);
    await createIssue({ title: "T", body: "B", labels: ["bug"] });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/GoBwah40/virgule/issues");
    expect(init.headers.Authorization).toBe("Bearer github_pat_x");
    expect(JSON.parse(init.body)).toEqual({ title: "T", body: "B", labels: ["bug"] });
  });

  it("throws when GitHub refuses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad credentials", { status: 401 })));
    await expect(createIssue({ title: "T", body: "B", labels: [] })).rejects.toThrow("401");
  });
});
