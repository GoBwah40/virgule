import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { ProgressMeter } from "@/components/progress-meter";
import { PhaseTransition } from "@/components/phase-transition";
import { BackToThemesButton, FinishVotingButton, ThemeIdeas } from "@/components/phases/voting-board";
import { getVoteProgress, getVotingView, loadPhasePage } from "@/lib/room";

export default async function IdeasPage({ params }: PageProps<"/r/[slug]/ideas">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["IDEAS"]);
  if (!page) return null;

  const t = await getTranslations("ideas");
  const { room, me } = page;
  const [themes, progress] = await Promise.all([
    getVotingView(room.id, room.round, me.id, room.allowSelfVote),
    // Réservé à l'animateur : savoir si tout le monde a voté avant de clore.
    me.isHost ? getVoteProgress(room.id, room.round, room.allowSelfVote) : null,
  ]);

  const votable = themes.flatMap((th) => th.ideas).filter((i) => i.canVote);
  const voted = votable.filter((i) => i.myVote !== null).length;

  return (
    <PhaseTransition>
      <PageHeader
        title={t("title")}
        subtitle={room.round > 1 ? t("roundSubtitle", { round: room.round }) : t("subtitle")}
        actions={
          me.isHost && (
            <>
              <FinishVotingButton slug={slug} />
              <BackToThemesButton slug={slug} />
            </>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {progress && progress.total > 0 && (
          <ProgressMeter
            value={progress.done}
            max={progress.total}
            label={t("voteProgress", { done: progress.done, total: progress.total })}
            completeLabel={t("voteProgressComplete")}
            ariaLabel={t("voteProgressLabel")}
          />
        )}
        {votable.length > 0 && (
          <p className="text-sm text-muted-foreground">{t("myVotes", { voted, total: votable.length })}</p>
        )}
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        {themes.map((theme) => (
          <ThemeIdeas key={theme.id} slug={slug} theme={theme} />
        ))}
      </div>
    </PhaseTransition>
  );
}
