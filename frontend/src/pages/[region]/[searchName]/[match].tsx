import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import Skeleton from "@/components/general/skeleton";
import {
  useBans,
  useMatch,
  useParticipants,
  useSummoner,
  useTimeline,
  useQueues,
  useBasicChampions,
  useSimpleSpectate,
} from "@/hooks";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { SimpleMatchType, SummonerType } from "@/external/types";
import type {
  BanType,
  AdvancedTimelineType,
  FullParticipantType,
} from "@/external/iotypes/match";
import {
  convertRank,
  convertTier,
  getLoser,
  getMyPart,
  getWinner,
  mediaUrl,
} from "@/components/utils";
import {
  ChampionClump,
  ItemClump,
  StatClump,
  BountyClump,
  TeamContributionStrip,
} from "@/components/summoner/matchCard";
import { ImpactRank } from "@/components/summoner/impactRank";
import clsx from "clsx";
import numeral from "numeral";
import { MapEventsInner } from "@/components/summoner/matchDetails/mapEvents";
import { Timeline } from "@/components/summoner/matchDetails/gameTimeline";
import { ChampionTimelinesInner } from "@/components/summoner/matchDetails/championTimelines";
import { StatOverview } from "@/components/summoner/matchDetails/championStats";
import BuildOrder from "@/components/summoner/matchDetails/buildOrder";
import { RunePage } from "@/components/summoner/matchDetails/runePage";
import Image from "@/compat/image";
import { formatDatetimeFull } from "@/components/utils";
import { PingStats } from "@/components/summoner/matchDetails/pingStats";
import { Popover } from "react-tiny-popover";
import { InGameDot } from "@/components/general/favoriteList";
import { ARENA_QUEUE } from "@/utils/constants";
import { LoadingScreen } from "@/components/general/loadingScreen";

const routeApi = getRouteApi("/$region/$searchName/$match");

export default function Match() {
  const {
    match: matchId,
    region,
    searchName,
    riot_id_name: riotIdName = "",
    riot_id_tagline: riotIdTagline = "",
  } = routeApi.useParams();
  const { returnPath = "" } = routeApi.useSearch();
  const matchQuery = useMatch(matchId);
  const match = matchQuery.data;
  const participantsQuery = useParticipants(matchId);
  const participants = participantsQuery.data;
  const timelineQuery = useTimeline({ matchId });
  const summonerQ = useSummoner({ region, riotIdName, riotIdTagline });
  const summoner = summonerQ.data;
  const banQuery = useBans(matchId);
  const bans = banQuery.data?.results || [];
  const queuesQuery = useQueues();
  const isLoading =
    matchQuery.isLoading ||
    participantsQuery.isLoading ||
    timelineQuery.isLoading ||
    summonerQ.isLoading ||
    queuesQuery.isLoading ||
    banQuery.isLoading;

  function body() {
    if (isLoading) {
      return <LoadingScreen />;
    } else if (!match || !participants || !summoner) {
      return <div>There was an error loading the match.</div>;
    } else {
      return (
        <InnerMatch
          match={match}
          participants={participants}
          timeline={timelineQuery.data}
          summoner={summoner}
          bans={bans}
          queueName={queuesQuery.data?.[match.queue_id]?.description}
        />
      );
    }
  }

  return (
    <Skeleton topPad={0}>
      <div className="ml-10 flex">
        <Link
          to={returnPath || "/$region/$searchName"}
          params={{ region, searchName }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mr-1 inline h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
          profile
        </Link>
      </div>
      {body()}
    </Skeleton>
  );
}

function InnerMatch({
  match,
  participants,
  timeline,
  summoner,
  bans,
  queueName = "Unknown Game Type",
}: {
  match: SimpleMatchType;
  participants: FullParticipantType[];
  timeline?: AdvancedTimelineType;
  summoner: SummonerType;
  bans: BanType[];
  queueName?: string;
}) {
  const team100 = getWinner(match.queue_id, participants);
  const team200 = getLoser(match.queue_id, participants);
  const mypart = getMyPart(participants, summoner.puuid);
  const team100Bans = bans.filter((x) => x.team === 100);
  const team200Bans = bans.filter((x) => x.team === 200);
  const minutes = Math.round(match.game_duration / 60_000);
  const seconds = (match.game_duration % 60_000) / 1000;

  const isShowRunes = ![ARENA_QUEUE].includes(match.queue_id);

  return (
    <div>
      <div className="mb-3 text-center">
        <div className="text-lg font-bold">{queueName}</div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 text-sm text-zinc-400">
          <span>
            {minutes}:{numeral(seconds).format("00")}
          </span>
          <span>{formatDatetimeFull(match.game_creation)}</span>
          <span>
            Patch{" "}
            <span className="font-semibold text-zinc-200">
              {match.game_version.split(".").slice(0, 2).join(".")}
            </span>
            <span className="text-xs">
              .{match.game_version.split(".").slice(2).join(".")}
            </span>
          </span>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="quiet-scroll flex w-fit overflow-x-auto rounded bg-zinc-800/40 p-2">
          <div className="my-auto min-w-fit pr-1">
            <TeamSide
              team={team100}
              match={match}
              bans={team100Bans}
              timeline={timeline}
            />
          </div>
          <div className="bg-linear-to-r my-auto rounded-full from-cyan-700 to-rose-700 p-3 font-bold">
            VS
          </div>
          <div className="my-auto min-w-fit pl-1">
            <TeamSide
              team={team200}
              match={match}
              bans={team200Bans}
              timeline={timeline}
            />
          </div>
        </div>
      </div>
      <div className="m-2 mt-2 flex flex-wrap justify-center gap-3">
        {timeline && (
          <SectionCard title="Map Events">
            <MapEventsInner
              timeline={timeline.frames}
              participants={participants}
              match={{ _id: match._id }}
            />
          </SectionCard>
        )}
        {timeline && (
          <SectionCard title="Game Timeline">
            <Timeline
              timeline={timeline.frames}
              match={match}
              participants={participants}
              summoner={summoner}
            />
          </SectionCard>
        )}
        {mypart && timeline && (
          <SectionCard title="Champion Timelines">
            <ChampionTimelinesInner
              matchId={match._id}
              participants={participants}
              summoner={summoner}
              timeline={timeline.frames}
            />
          </SectionCard>
        )}
        {mypart && (
          <SectionCard title="Stat Comparison">
            <StatOverview
              participants={participants}
              match={match}
              mypart={mypart}
            />
          </SectionCard>
        )}
        <SectionCard title="Build Order">
          <BuildOrder
            timeline={timeline?.frames}
            expanded_width={500}
            participants={participants}
            summoner={summoner}
            match_id={match._id}
          />
        </SectionCard>
        {mypart && isShowRunes && (
          <SectionCard title="Runes">
            <RunePage
              mypart={mypart}
              participants={participants}
              match={{
                ...match,
                major: match.major ?? 0,
                minor: match.minor ?? 0,
              }}
              matchCardHeight={400}
            />
          </SectionCard>
        )}
        {mypart && (
          <SectionCard title="Ping Stats">
            <PingStats mypart={mypart} participants={participants} />
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/60 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function TeamSide({
  team,
  match,
  bans,
  timeline,
}: {
  team: FullParticipantType[];
  match: SimpleMatchType;
  bans: BanType[];
  timeline?: AdvancedTimelineType;
}) {
  let isWin: boolean;
  if (match.queue_id === ARENA_QUEUE) {
    isWin = team[0]?.placement === 1;
  } else {
    isWin = !!team[0]?.stats.win;
  }

  // Calculate total bounty for the team
  const totalBounty = timeline?.bounties
    ? team.reduce((sum, part) => {
        const bountyData = timeline.bounties?.[part._id];
        return sum + (bountyData?.total_bounty_received || 0);
      }, 0)
    : 0;

  return (
    <div>
      <div
        className={clsx("rounded", {
          "bg-linear-to-tr from-emerald-600/0 via-teal-700/20 to-emerald-600/30":
            isWin,
        })}
      >
        {team.map((part, key) => {
          return (
            <div key={part._id} className={clsx({ "mt-1": key > 0 })}>
              <ParticipantInfo part={part} match={match} team={team} />
            </div>
          );
        })}
      </div>
      <div className="text-center">
        {timeline?.bounties && (
          <div className="mt-2">
            <span className="font-bold">Team Bounty Received: </span>
            <span className="text-yellow-400">
              {numeral(totalBounty).format("0,0")}g
            </span>
          </div>
        )}
        <div className="mt-2 text-lg font-bold">Bans</div>
        <BanList bans={bans} />
      </div>
    </div>
  );
}

function BanList({ bans }: { bans: BanType[] }) {
  const champions = useBasicChampions();
  const [hoveredBan, setHoveredBan] = useState<string | null>(null);

  return (
    <div className="flex justify-around">
      {bans.map((ban) => {
        const url = mediaUrl(champions[ban.champion_id]?.image?.file_40 ?? "");
        const championName = champions[ban.champion_id]?.name || "";
        const banKey = `${ban.team}-${ban.pick_turn}`;

        return (
          <Fragment key={banKey}>
            {!!url && (
              <Popover
                isOpen={hoveredBan === banKey}
                positions={["top", "bottom"]}
                containerStyle={{ padding: "5px" }}
                content={
                  <div className="rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg">
                    {championName}
                  </div>
                }
              >
                <div
                  onMouseEnter={() => {
                    setHoveredBan(banKey);
                  }}
                  onMouseLeave={() => setHoveredBan(null)}
                >
                  <Image alt={championName} src={url} height={40} width={40} />
                </div>
              </Popover>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function ParticipantInfo({
  part,
  match,
  team,
}: {
  part: FullParticipantType;
  match: SimpleMatchType;
  team: FullParticipantType[];
}) {
  const {
    region,
    riot_id_name: riotIdName = "",
    riot_id_tagline: riotIdTagline = "",
  } = routeApi.useParams();
  const summoner = useSummoner({ region, riotIdName, riotIdTagline }).data;
  const name = part.riot_id_name.split(/\s+/).join(" ");
  const spectate = useSimpleSpectate(part.puuid, region).data;

  return (
    <div
      className={clsx("rounded p-2", {
        "bg-white/10 shadow-md": summoner?.puuid === part.puuid,
      })}
    >
      <div className="flex">
        <div className="my-auto flex h-full flex-col">
          <div className="text-sm font-bold">
            <Link
              className="flex cursor-pointer hover:underline"
              to="/puuid/$puuid"
              params={{ puuid: part.puuid }}
            >
              <>
                <div>{name}</div>
                <div className="text-gray-400">#{part.riot_id_tagline}</div>
              </>
            </Link>
          </div>
          <div className="flex">
            <div className="my-auto h-full">
              <div className="relative">
                <ChampionClump
                  part={part}
                  major={match.major ?? 0}
                  minor={match.minor ?? 0}
                />
                {spectate && (
                  <div className="absolute -left-2 -top-2">
                    <InGameDot
                      queueId={spectate.gameQueueConfigId}
                      startTime={spectate.gameStartTime}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="my-auto ml-2 h-full">
              <ItemClump
                part={part}
                version={{ major: match.major ?? 0, minor: match.minor ?? 0 }}
              />
            </div>
          </div>
        </div>
        <div className="my-auto ml-2 h-full">
          <StatClump part={part} match={match} />
        </div>
        <div className="my-auto ml-2 h-full">
          <BountyClump part={part} matchId={match._id} />
        </div>
        <div className="my-auto ml-2 h-full">
          <SecondaryStatClump part={part} match={match} />
        </div>
      </div>
      <TeamContributionStrip
        part={part}
        participants={team}
        className="mx-1 mt-1"
      />
    </div>
  );
}

function SecondaryStatClump({
  part,
  match,
}: {
  part: FullParticipantType;
  match: SimpleMatchType;
}) {
  const minutes = match.game_duration / 1000 / 60 || 1;
  const stats = part.stats;
  const gpm = stats.gold_earned / minutes;
  const cspm =
    (stats.total_minions_killed + stats.neutral_minions_killed) / minutes;
  const format = (x: number, fmt = "0.00") => numeral(x).format(fmt);
  const rank = convertTier(part.tier ?? "") + convertRank(part.rank ?? "");
  return (
    <div className="flex w-fit flex-col gap-y-1 text-center">
      <div
        className={clsx("w-full rounded px-2 font-bold", {
          "bg-linear-to-tr from-purple-800 via-fuchsia-700 to-violet-700":
            !!rank,
          "bg-zinc-800": !rank,
        })}
      >
        {rank ? rank : "NA"}
      </div>
      <div
        title={`Rank: ${part.impact_rank || "N/A"}\nImpact Score: ${format(
          part.impact_score || 0,
          "0.00",
        )}`}
      >
        <ImpactRank
          impact_rank={part.impact_rank}
          impact_score={part.impact_score}
        />
      </div>
      <div className="leading-none">
        {format(gpm, "0")}
        <span className="text-xs">GPM</span>
      </div>
      <div className="leading-none">
        {format(cspm, "0.0")}
        <span className="text-xs">CS/M</span>
      </div>
    </div>
  );
}
