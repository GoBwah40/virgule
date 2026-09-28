import { getTranslations } from "next-intl/server";

import { BackToThemesButton, FinishVotingButton, ThemeIdeas } from "@/components/phases/voting-board";
import { PhaseTitle } from "@/components/phases/phase-title";
import { getVotingView, loadPhasePage } from "@/lib/room";

export default async function IdeasPage({ params }: PageProps<"/r/[slug]/ideas">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["IDEAS"]);
  if (!page) return null;

  const t = await getTranslations("ideas");
  const { room, me } = page;
  const themes = await getVotingView(room.id, room.round, me.id, room.allowSelfVote);

  const votable = themes.flatMap((th) => th.ideas).filter((i) => i.canVote);
  const voted = votable.filter((i) => i.myVote !== null).length;

  return (
    <>
      <PhaseTitle
        title={t("title")}
        subtitle={room.round > 1 ? t("roundSubtitle", { round: room.round }) : t("subtitle")}
        actions={
          me.isHost && (
            <>
              <BackToThemesButton slug={slug} />
              <FinishVotingButton slug={slug} />
            </>
          )
        }
      />
      {votable.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">{t("myVotes", { voted, total: votable.length })}</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {themes.map((theme) => (
          <ThemeIdeas key={theme.id} slug={slug} theme={theme} />
        ))}
      </div>
    </>
  );
}
