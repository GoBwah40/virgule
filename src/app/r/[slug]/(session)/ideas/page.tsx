import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/countdown";
import { PageHeader } from "@/components/page-header";
import { ProgressMeter } from "@/components/progress-meter";
import { PhaseTransition } from "@/components/phase-transition";
import { VoteReminder } from "@/components/vote-reminder";
import { ViewChoiceSwitch, ViewProvider } from "@/components/phases/view-choice";
import { AutoRecap, BackToThemesButton, FinishVotingButton, IdeasBoard, NudgeButton, TimerControls } from "@/components/phases/voting-board";
import { isRecentNudge, nextNudgeAt } from "@/lib/config";
import { pointsLeft } from "@/lib/results";
import { parseViewPreference, VIEW_COOKIE } from "@/lib/view-preference";
import { getVoteProgress, getVotingView, hostName, loadPhasePage } from "@/lib/room";

export default async function IdeasPage({ params }: PageProps<"/r/[slug]/ideas">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["IDEAS"]);
  if (!page) return null;

  const t = await getTranslations("ideas");
  const { room, me } = page;
  const [themes, progress] = await Promise.all([
    getVotingView(room.id, room.round, me, room.allowSelfVote, room.allowComments),
    // Host only: know whether everyone has voted before closing.
    me.isHost ? getVoteProgress(room.id, room.round, room.allowSelfVote) : null,
  ]);

  // What is left for you to vote on: one unit per idea, except a single-answer list,
  // where picking one option is enough. In a limited topic, once your "for" votes are used up,
  // the remaining ideas no longer count as waiting for your vote. A points topic is one unit too,
  // done once every point is given.
  const units = themes.flatMap((th) => {
    const votable = th.ideas.filter((i) => i.canVote);
    if (th.pointsBudget !== null) {
      return votable.length > 0 ? [pointsLeft(th.pointsBudget, th.ideas.map((i) => i.myPoints)) === 0] : [];
    }
    if (th.singleChoice) return votable.length > 0 ? [votable.some((i) => i.myVote !== null)] : [];
    const used = th.ideas.filter((i) => i.myVote === true).length;
    const exhausted = th.maxVotes !== null && used >= th.maxVotes;
    return votable.map((i) => exhausted || i.myVote !== null);
  });
  const voted = units.filter(Boolean).length;
  const nudgedAt = room.nudgedAt ? new Date(room.nudgedAt) : null;
  const host = hostName(page.participants);

  return (
    <PhaseTransition>
      <ViewProvider initialView={parseViewPreference((await cookies()).get(VIEW_COOKIE)?.value)}>
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
            <>
              {me.isHost && (
                <>
                  <FinishVotingButton slug={slug} />
                  <BackToThemesButton slug={slug} />
                </>
              )}
              <ViewChoiceSwitch />
            </>
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
              {room.autoRecap && <AutoRecap slug={slug} endsAt={room.phaseEndsAt.toISOString()} />}
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
          {me.isHost && progress && progress.total > 0 && (
            <NudgeButton slug={slug} availableAt={nextNudgeAt(nudgedAt)?.toISOString() ?? null} />
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
        {/* The host's reminder: each page decides for its own participant, the server never knows who. */}
        {!me.isHost && (
          <VoteReminder
            sentAt={isRecentNudge(nudgedAt) ? room.nudgedAt : null}
            storageKey={`virgule:nudge:${slug}`}
            concerned={voted < units.length}
            message={t("nudgeReceived", { host })}
          />
        )}
        <IdeasBoard slug={slug} themes={themes} allowNewIdeas={!room.tiebreak} hostName={host} />
      </ViewProvider>
    </PhaseTransition>
  );
}
