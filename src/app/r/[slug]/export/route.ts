import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { exportFileName, toCsv, toMarkdown, type ExportLabels } from "@/lib/export";
import { getOverviewText } from "@/lib/overview-format";
import { getRecap, getRoomContext } from "@/lib/room";

const FORMATS = {
  md: { contentType: "text/markdown; charset=utf-8", render: toMarkdown },
  csv: { contentType: "text/csv; charset=utf-8", render: toCsv },
} as const;

export async function GET(request: Request, { params }: RouteContext<"/r/[slug]/export">) {
  const { slug } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "md";
  if (!(format in FORMATS)) return new Response("Unsupported format", { status: 400 });

  const ctx = await getRoomContext(slug);
  if (ctx.status !== "ok") return new Response("Not found", { status: 404 });
  if (!ctx.me) return new Response("Forbidden", { status: 403 });
  // During voting, scores are not public: export is only available at the recap.
  if (ctx.room.phase !== "RECAP" && ctx.room.phase !== "CLOSED") {
    return new Response("Export available from the recap phase", { status: 409 });
  }

  const rounds = await getRecap(ctx.room, null);
  const now = new Date();
  const t = await getTranslations("export");
  const tRecap = await getTranslations("recap");
  const format_ = await getFormatter();
  const overviewText = await getOverviewText();

  const labels: ExportLabels = {
    csvSeparator: (await getLocale()) === "fr" ? ";" : ",",
    title: t("fileTitle", { name: ctx.room.name }),
    generatedOn: t("generatedOn", { date: format_.dateTime(now, { dateStyle: "long", timeStyle: "short" }) }),
    participants: t("participants"),
    rules: t("rules"),
    rule: ctx.room.requireNetPositive ? t("ruleNetPositive") : t("ruleAnyUpvote"),
    roundTitle: (round) => tRecap("roundTab", { round }),
    summary: (qualified, total) => tRecap("summary", { qualified, total }),
    empty: tRecap("empty"),
    qualified: tRecap("qualified"),
    notQualified: tRecap("notQualified"),
    overview: overviewText,
    overviewStatus: t("overviewStatus"),
    columns: {
      round: t("columns.round"),
      theme: t("columns.theme"),
      idea: t("columns.idea"),
      up: t("columns.up"),
      down: t("columns.down"),
      net: t("columns.net"),
      status: t("columns.status"),
    },
  };

  const { contentType, render } = FORMATS[format as keyof typeof FORMATS];
  const body = render({ participants: ctx.participants.map((p) => p.pseudo), rounds }, labels);

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${exportFileName(ctx.room.name, now)}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
