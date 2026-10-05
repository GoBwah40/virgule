import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/countdown";
import { PageHeader } from "@/components/page-header";
import { ProgressMeter } from "@/components/progress-meter";
import { PhaseTransition } from "@/components/phase-transition";
import { BackToThemesButton, FinishVotingButton, IdeasBoard, TimerControls } from "@/components/phases/voting-board";
import { IDEAS_VIEW_COOKIE, parseIdeasView } from "@/lib/ideas-view";
import { getVoteProgress, getVotingView, hostName, loadPhasePage } from "@/lib/room";

export default async function IdeasPage({ params }: PageProps<"/r/[slug]/ideas">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["IDEAS"]);
  if (!page) return null;

  const t = await getTranslations("ideas");
  const { room, me } = page;
  const [themes, progress] = await Promise.all([
    getVotingView(room.id, room.round, me, room.allowSelfVote),
    // Host only: know whether everyone has voted before closing.
    me.isHost ? getVoteProgress(room.id, room.round, room.allowSelfVote) : null,
  ]);

  // What is left for you to vote on: one unit per idea, except a single-answer list,
  // where picking one option is enough. In a limited topic, once your "for" votes are used up,
  // the remaining ideas no longer count as waiting for your vote.
  const units = themes.flatMap((th) => {
    const votable = th.ideas.filter((i) => i.canVote);
    if (th.singleChoice) return votable.length > 0 ? [votable.some((i) => i.myVote !== null)] : [];
    const used = th.ideas.filter((i) => i.myVote === true).length;
    const exhausted = th.maxVotes !== null && used >= th.maxVotes;
    return votable.map((i) => exhausted || i.myVote !== null);
  });
  const voted = units.filter(Boolean).length;

  return (
    <PhaseTransition>
      <PageHeader
        title={t("title")}
        subtitle={
          room.tiebreak
            ? t("tiebreakSubtitle", { round: room.round })
            : room.round > 1
              ? t("roundSubtitle", { round: room.round })
              : t("subtitle")
        }
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
        {room.phaseEndsAt && (
          <div className="flex flex-wrap items-center gap-2">
            <Countdown
              endsAt={room.phaseEndsAt.toISOString()}
              labels={{ running: t("timerLabel"), expired: t("timerExpired") }}
            />
            {me.isHost && <TimerControls slug={slug} />}
          </div>
        )}
        {progress && progress.total > 0 && (
          <ProgressMeter
            value={progress.done}
            max={progress.total}
            label={t("voteProgress", { done: progress.done, total: progress.total })}
            completeLabel={t("voteProgressComplete")}
            ariaLabel={t("voteProgressLabel")}
          />
        )}
        {/* Gentle nudge: everyone sees what they have left, without knowing anything about the others. */}
        {units.length > 0 && (
          <ProgressMeter
            value={voted}
            max={units.length}
            label={t("myVotesLeft", { count: units.length - voted })}
            completeLabel={t("myVotesComplete")}
            ariaLabel={t("myVotesLabel")}
          />
        )}
      </div>
      <IdeasBoard
        slug={slug}
        themes={themes}
        allowNewIdeas={!room.tiebreak}
        hostName={hostName(page.participants)}
        initialView={parseIdeasView((await cookies()).get(IDEAS_VIEW_COOKIE)?.value)}
      />
    </PhaseTransition>
  );
}
