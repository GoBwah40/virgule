import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/countdown";
import { PresentationCarousel } from "@/components/presentation-carousel";
import { PresentationIdeas } from "@/components/presentation-ideas";
import { PresentationJoin } from "@/components/presentation-join";
import { PresentationLobby } from "@/components/presentation-lobby";
import { PresentationProgress } from "@/components/presentation-progress";
import { PresentationResult } from "@/components/presentation-result";
import { PresentationScreen } from "@/components/presentation-screen";
import { PresentationSeats } from "@/components/presentation-seats";
import { PresentationTopics } from "@/components/presentation-topics";
import { RoomExpired } from "@/components/room/room-expired";
import { RoomLive } from "@/components/room/room-live";
import type { Phase } from "@/generated/prisma/enums";
import { MAX_PARTICIPANTS } from "@/lib/config";
import { pusherClientConfig } from "@/lib/realtime/server";
import { getPresentationView, getRoomContext, hostName } from "@/lib/room";
import { getScreenToken } from "@/lib/session";

const STEPS: Phase[] = ["THEMES", "IDEAS", "RECAP"];
/** Ideas listed under the kept one in the recap: more would not be readable from across the room. */
const RANKED_IDEAS = 5;

export async function generateMetadata({ params }: PageProps<"/r/[slug]/present">): Promise<Metadata> {
  const ctx = await getRoomContext((await params).slug);
  return { title: ctx.status === "ok" ? ctx.room.name : undefined, robots: { index: false } };
}

/**
 * Room screen (TV, projector), opened by the host on their own device or on a screen paired with a
 * code from their phone: no extra link, no seat taken. A view of its own, built for the group, never the host's page: that one marks the host's
 * ideas. It follows the session like the phones do, and changes step by itself.
 */
export default async function PresentPage({ params }: PageProps<"/r/[slug]/present">) {
  const { slug } = await params;
  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") notFound();
  if (ctx.status === "expired") return <RoomExpired />;
  if (!ctx.me?.isHost && !ctx.isScreen) {
    // A screen the host has disconnected (or replaced): back to pairing, not to the join form.
    if (!ctx.me && (await getScreenToken(slug))) redirect("/present");
    // Anyone else goes back to the session (or to the join form).
    redirect(`/r/${slug}`);
  }

  const { room, participants } = ctx;
  const view = await getPresentationView(room);
  const [t, tApp, tRoom, tIdeas, tThemes, tRecap] = await Promise.all([
    getTranslations("present"),
    getTranslations("app"),
    getTranslations("room"),
    getTranslations("ideas"),
    getTranslations("themes"),
    getTranslations("recap"),
  ]);

  const host = hostName(participants);
  const invitePath = `/r/${slug}`;
  const canJoin = participants.length < MAX_PARTICIPANTS && room.phase !== "CLOSED";
  const lobby = view.step === "THEMES" && view.topics.length === 0;

  const seats = (
    <PresentationSeats
      seats={participants.map((p) => ({ id: p.id, name: p.pseudo }))}
      capacity={MAX_PARTICIPANTS}
      label={canJoin ? t("seats", { count: participants.length, max: MAX_PARTICIPANTS }) : t("full")}
    />
  );
  const join = (size: "lg" | "sm") => <PresentationJoin path={invitePath} label={t("join")} qrLabel={tRoom("qrLabel")} size={size} />;
  // Latecomers: the code stays in a corner of the screen while seats are free.
  const cornerJoin = canJoin && join("sm");

  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (view.step === "THEMES") {
    if (lobby) {
      body = <PresentationLobby title={room.name} note={t("lobbyNote", { host })} join={canJoin ? join("lg") : null} />;
      footer = seats;
    } else {
      body = (
        <PresentationTopics
          title={t("topicsTitle")}
          topics={view.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            kindLabel: topic.kind === "TEXT" ? undefined : tThemes(`kinds.${topic.kind}`),
          }))}
        />
      );
      footer = (
        <>
          <div className="space-y-3">
            {seats}
            <p className="stage-sm text-muted-foreground [overflow-wrap:anywhere]">{t("topicsNote", { host })}</p>
          </div>
          {cornerJoin}
        </>
      );
    }
  } else if (view.step === "IDEAS") {
    body = (
      <PresentationIdeas
        emptyLabel={t("waitingIdeas")}
        topics={view.topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          countLabel: t("ideaCount", { count: topic.ideas.length }),
          ideas: topic.ideas,
        }))}
      />
    );
    footer = (
      <>
        <div className="flex flex-wrap items-center gap-x-[3vw] gap-y-3">
          {view.progress.total > 0 && (
            <PresentationProgress
              value={view.progress.done}
              max={view.progress.total}
              label={tIdeas("voteProgress", { done: view.progress.done, total: view.progress.total })}
              completeLabel={tIdeas("voteProgressComplete")}
              ariaLabel={tIdeas("voteProgressLabel")}
            />
          )}
          {view.endsAt && (
            <Countdown
              size="lg"
              endsAt={view.endsAt.toISOString()}
              labels={{ running: tIdeas("timerLabel"), expired: tIdeas("timerExpired") }}
            />
          )}
        </div>
        {cornerJoin}
      </>
    );
  } else {
    const slides = view.topics.map((topic) => {
      const winners = topic.ideas.filter((idea) => idea.leading).map((idea) => idea.content);
      return (
        <PresentationResult
          key={topic.id}
          topic={topic.title}
          winners={winners}
          verdict={winners.length === 0 ? t("noneKept") : winners.length > 1 ? t("tied") : t("kept")}
          ideas={topic.ideas.slice(0, RANKED_IDEAS).map((idea) => ({
            id: idea.id,
            content: idea.content,
            up: idea.score.up,
            down: idea.score.down,
            qualified: idea.qualified,
            votesLabel: t("votes", { up: idea.score.up, down: idea.score.down }),
            statusLabel: idea.qualified ? tRecap("qualified") : tRecap("notQualified"),
          }))}
          moreLabel={topic.ideas.length > RANKED_IDEAS ? t("more", { count: topic.ideas.length - RANKED_IDEAS }) : undefined}
        />
      );
    });
    body = (
      <PresentationCarousel
        label={t("results")}
        slides={slides}
        positions={view.topics.map((_, i) => t("topicPosition", { current: i + 1, total: view.topics.length }))}
      />
    );
    footer = (
      <p className="stage-sm text-muted-foreground">{view.closed ? `${tRecap("closedTitle")} · ${t("anonymous")}` : t("anonymous")}</p>
    );
  }

  return (
    <>
      <PresentationScreen
        appName={tApp("name")}
        title={room.name}
        showTitle={!lobby}
        stepsLabel={tRoom("phasesLabel")}
        steps={STEPS.map((id) => ({ id, label: tRoom(`phases.${id}`) }))}
        current={room.phase === "CLOSED" ? STEPS.length : STEPS.indexOf(room.phase)}
        fullscreenHint={t("fullscreenHint")}
        footer={footer}
      >
        {body}
      </PresentationScreen>
      {/* Same sync as the phones; the page itself shows the current step, so it refreshes in place. */}
      <RoomLive slug={slug} pusher={pusherClientConfig()} followPhase={false} />
    </>
  );
}
