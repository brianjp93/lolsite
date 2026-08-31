import type {
  BasicParticipantType,
  FullParticipantType,
} from "@/external/iotypes/match";
import type { BasicMatchType, SummonerType } from "@/external/types";
import {
  useBasicChampions,
  useQueues,
  useSimpleItem,
  useTimeline,
} from "@/hooks";
import { usePickTurn } from "@/stores";
import clsx from "clsx";
import Image from "@/compat/image";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import numeral from "numeral";
import { ItemPopover } from "../data/item";
import { Popover } from "react-tiny-popover";
import { useState } from "react";
import {
  formatDatetime,
  formatDatetimeFull,
  getLoser,
  getMyPart,
  getWinner,
  mediaUrl,
  queueColor,
} from "../utils";
import { ImpactRank } from "./impactRank";

const routeApi = getRouteApi("/$region/$searchName");

export default function MatchCard({
  match,
  summoner,
}: {
  match: BasicMatchType;
  summoner: SummonerType;
}) {
  const location = useLocation();
  const { region, searchName } = routeApi.useParams();
  const queues = useQueues().data || {};
  const queue = queues[match.queue_id];
  const part = getMyPart(match.participants, summoner.puuid);
  const myTeam = match.teams.filter((x) => x._id === part?.team_id)?.[0];
  const enemyTeam = match.teams.filter((x) => x._id !== part?.team_id)?.[0];
  const minutes = match.game_duration / 1000 / 60;
  const minuteSecond = `${Math.floor(minutes)}:${numeral(
    (match.game_duration / 1000) % 60,
  ).format("00")}`;
  const creationFull = formatDatetimeFull(match.game_creation);
  const creation = formatDatetime(match.game_creation);
  const isTie = minutes < 5;
  return (
    <>
      <div
        className={clsx(
          "my-2 w-fit rounded-md bg-gradient-to-r to-zinc-900/50 p-2",
          "quiet-scroll overflow-x-auto",
          {
            "from-[#71101366]": enemyTeam?.win && !isTie,
            "from-[#1d6944ba]": myTeam?.win && !isTie,
            "from-zinc-900/50": isTie,
          },
        )}
      >
        <div className="flex">
          <div className="flex min-w-fit flex-col">
            <div className="flex text-xs">
              <div className="mr-2 font-bold">{minuteSecond}</div>
              <div title={creationFull}>{creation}</div>
            </div>
            <div className="flex">
              <div className="my-auto h-full min-w-fit">
                {part && (
                  <ChampionClump
                    part={part}
                    major={match.major}
                    minor={match.minor}
                  />
                )}
              </div>
              {part && (
                <div className="my-auto ml-1 h-full min-w-fit">
                  <ItemClump
                    part={part}
                    version={{ major: match.major, minor: match.minor }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div
                className={clsx(
                  "text-xs font-bold",
                  queueColor(match.queue_id),
                )}
              >
                {queue?.description || match.queue_id}
              </div>
              {part && (
                <div className="w-11 text-center">
                  <ImpactRank
                    impact_rank={part.impact_rank}
                    impact_score={part.impact_score}
                  />
                </div>
              )}
            </div>
          </div>
          {part && (
            <div className="my-auto ml-1">
              <StatClump part={part} match={match} />
            </div>
          )}
          <div className="my-auto ml-1">
            <ParticipantClump match={match} summoner={summoner} />
          </div>
          <div className="ml-1 w-8">
            <Link
              title="View match details"
              className="btn btn-default m-auto flex h-full w-full p-0!"
              to="/$region/$searchName/$match"
              params={{
                region,
                searchName,
                match: match._id,
              }}
              search={{ returnPath: location.href }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="m-auto h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </Link>
          </div>
        </div>
        {part && (
          <TeamContributionStrip
            part={part}
            participants={match.participants}
          />
        )}
      </div>
    </>
  );
}

function ParticipantClump({
  match,
  summoner,
}: {
  match: BasicMatchType;
  summoner: SummonerType;
}) {
  const team100 = getWinner(match.queue_id, match.participants);
  const team200 = getLoser(match.queue_id, match.participants);
  const part = getMyPart(match.participants, summoner.puuid);
  return (
    <div className="flex">
      <TeamClump team={team100} part={part} />
      <TeamClump team={team200} part={part} />
    </div>
  );
}

function TeamClump({
  team,
  part,
}: {
  team: BasicParticipantType[];
  part?: BasicParticipantType;
}) {
  const champions = useBasicChampions();
  return (
    <div className="w-32 md:w-44">
      {team.map((teammate) => {
        const champion = champions[teammate.champion_id];
        const link = (
          <div
            className={clsx(
              "ml-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-xs",
              {
                "font-bold": teammate.puuid === part?.puuid,
              },
            )}
            title={teammate.riot_id_name}
          >
            {teammate.riot_id_name} #{teammate.riot_id_tagline}
          </div>
        );
        return (
          <div className="flex" key={teammate._id}>
            <>
              {champion && (
                <Image
                  className="rounded"
                  src={mediaUrl(champion.image.file_15)}
                  width={16}
                  height={16}
                  alt={champion.name}
                />
              )}
              {teammate.puuid === part?.puuid ? (
                link
              ) : (
                <Link
                  className="cursor-pointer overflow-hidden hover:underline"
                  to="/puuid/$puuid"
                  params={{ puuid: teammate.puuid }}
                >
                  {link}
                </Link>
              )}
            </>
            <div className="ml-auto mr-1 hidden text-xs md:flex">
              <div className="text-gray-400">{teammate.stats.kills}</div>
              <div className="mx-1 text-gray-500">/</div>
              <div className="text-gray-400">{teammate.stats.deaths}</div>
              <div className="mx-1 text-gray-500">/</div>
              <div className="text-gray-400">{teammate.stats.assists}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TeamContributionStrip({
  part,
  participants,
  className = "mt-2",
}: {
  part: BasicParticipantType;
  participants: BasicParticipantType[];
  className?: string;
}) {
  const team = participants.filter(({ team_id }) => team_id === part.team_id);
  const stats = [
    [
      "Damage",
      "Team champion damage",
      "total_damage_dealt_to_champions",
      "text-rose-300",
    ],
    ["Gold", "Team gold", "gold_earned", "text-amber-300"],
    ["Vision", "Team vision", "vision_score", "text-cyan-300"],
    [
      "Objectives",
      "Team objective damage",
      "damage_dealt_to_objectives",
      "text-violet-300",
    ],
  ] as const;

  return (
    <div
      aria-label="Team contributions"
      role="group"
      className={clsx("grid grid-cols-4 gap-1.5 text-[10px]", className)}
    >
      {stats.map(([label, title, stat, color]) => {
        const total = team.reduce(
          (sum, teammate) => sum + teammate.stats[stat],
          0,
        );
        const percent = Math.round(
          total ? (part.stats[stat] / total) * 100 : 0,
        );
        return (
          <div
            key={stat}
            title={title}
            className="bg-zinc-950/30 rounded px-2 py-1.5 ring-1 ring-white/5"
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className="font-medium uppercase tracking-wide text-zinc-400">
                {label}
              </span>
              <span className={clsx("font-bold tabular-nums", color)}>
                {percent}%
              </span>
            </div>
            <progress
              aria-label={`${title}: ${percent}%`}
              className={clsx(
                "mt-1 block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-zinc-700/80",
                "[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-zinc-700/80",
                "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-current",
                "[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-current",
                color,
              )}
              max={100}
              value={percent}
            />
          </div>
        );
      })}
    </div>
  );
}

export function StatClump({
  part,
  match,
}: {
  part: BasicParticipantType;
  match: { game_duration: number };
}) {
  const deaths = part.stats.deaths || 1;
  const kda = (part.stats.kills + part.stats.assists) / deaths;
  const minutes = match.game_duration / 1000 / 60;
  const dpm = part.stats.total_damage_dealt_to_champions / minutes;
  const vspm = part.stats.vision_score / minutes;

  return (
    <div className="w-24 rounded-md bg-gray-900 px-2 py-1 leading-tight text-gray-400">
      <div className="mx-auto flex w-fit items-end">
        <div className="font-bold text-emerald-600">{part.stats.kills}</div>
        <div className="mx-1">/</div>
        <div className="font-bold text-red-600">{part.stats.deaths}</div>
        <div className="mx-1">/</div>
        <div className="font-bold text-cyan-600">{part.stats.assists}</div>
      </div>
      <div className="flex items-end">
        <div className="mr-2">{numeral(kda).format("0.00")}</div>
        <div className="ml-auto text-xs font-bold">KDA</div>
      </div>
      <div className="flex items-end">
        <div className="mr-2">{numeral(dpm).format("0")}</div>
        <div className="ml-auto text-xs font-bold">DPM</div>
      </div>
      <div className="flex items-end">
        <div className="mr-2">{numeral(vspm).format("0.00")}</div>
        <div className="ml-auto text-xs font-bold">VS/M</div>
      </div>
    </div>
  );
}

export function BountyClump({
  part,
  matchId,
}: {
  part: BasicParticipantType;
  matchId: string;
}) {
  const timelineQuery = useTimeline({ matchId });
  const timeline = timelineQuery.data;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isGivenPopoverOpen, setIsGivenPopoverOpen] = useState(false);

  if (!timeline?.bounties) {
    return null;
  }

  const bounties = timeline.bounties[part._id];

  if (!bounties) {
    return null;
  }

  return (
    <div className="flex w-28 flex-col gap-y-1 rounded-md bg-gray-900 px-2 py-1 leading-tight text-gray-400">
      <div className="flex items-end text-xs" title="Gold received from kills.">
        <div className="mr-1 font-bold text-yellow-500">
          {numeral(bounties.champion_kill_gold).format("0,0")}g
        </div>
        <div className="ml-auto font-bold">Kills</div>
      </div>
      <div
        className="flex items-end text-xs"
        title="Gold received from assists."
      >
        <div className="mr-1 font-bold text-yellow-500">
          {numeral(bounties.champion_assist_gold).format("0,0")}g
        </div>
        <div className="ml-auto font-bold">Assists</div>
      </div>

      <Popover
        isOpen={isPopoverOpen}
        positions={["top", "bottom", "left", "right"]}
        containerStyle={{ zIndex: "11", padding: "0" }}
        content={
          <div className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-300 shadow-2xl shadow-black/80">
            <div className="mb-2 font-bold text-yellow-500">
              Bounty Breakdown
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Champion Bounty:</div>
              <div className="font-bold text-yellow-500">
                {numeral(bounties.champion_kill_bounty).format("0,0")}g
              </div>
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Monster Bounty:</div>
              <div className="font-bold text-yellow-500">
                {numeral(bounties.monster_bounty).format("0,0")}g
              </div>
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Tower Bounty:</div>
              <div className="font-bold text-yellow-500">
                {numeral(bounties.building_bounty).format("0,0")}g
              </div>
            </div>
            <div className="mt-2 flex justify-between gap-x-4 border-t border-gray-600 pt-2">
              <div className="font-bold">Total:</div>
              <div className="font-bold text-yellow-500">
                {numeral(bounties.total_bounty_received).format("0,0")}g
              </div>
            </div>
          </div>
        }
      >
        <div
          className="flex cursor-help items-end text-xs"
          title="Total bounty gold received."
          onMouseEnter={() => setIsPopoverOpen(true)}
          onMouseLeave={() => setIsPopoverOpen(false)}
        >
          <div className="mr-1 border-b border-dotted border-gray-500 font-bold text-yellow-500">
            {numeral(bounties.total_bounty_received).format("0,0")}g
          </div>
          <div className="ml-auto font-bold">Bounty</div>
        </div>
      </Popover>

      <Popover
        isOpen={isGivenPopoverOpen}
        positions={["top", "bottom", "left", "right"]}
        containerStyle={{ zIndex: "11", padding: "0" }}
        content={
          <div className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-300 shadow-2xl shadow-black/80">
            <div className="mb-2 font-bold text-red-500">
              Gold Given Breakdown
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Kill Gold:</div>
              <div className="font-bold text-red-500">
                {numeral(bounties.champion_kill_gold_given).format("0,0")}g
              </div>
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Assist Gold:</div>
              <div className="font-bold text-red-500">
                {numeral(bounties.champion_assist_gold_given).format("0,0")}g
              </div>
            </div>
            <div className="mb-1 flex justify-between gap-x-4">
              <div>Kill Bounty:</div>
              <div className="font-bold text-red-500">
                {numeral(bounties.champion_kill_bounty_given).format("0,0")}g
              </div>
            </div>
            <div className="mt-2 flex justify-between gap-x-4 border-t border-gray-600 pt-2">
              <div className="font-bold">Total:</div>
              <div className="font-bold text-red-500">
                {numeral(bounties.total_gold_given).format("0,0")}g
              </div>
            </div>
          </div>
        }
      >
        <div
          className="flex cursor-help items-end text-xs"
          title="Total gold given to enemy team."
          onMouseEnter={() => setIsGivenPopoverOpen(true)}
          onMouseLeave={() => setIsGivenPopoverOpen(false)}
        >
          <div className="mr-1 border-b border-dotted border-gray-500 font-bold text-red-700">
            -{numeral(bounties.total_gold_given).format("0,0")}g
          </div>
          <div className="ml-auto font-bold">Given</div>
        </div>
      </Popover>
    </div>
  );
}

export function ItemClump({
  part,
  version,
}: {
  part: BasicParticipantType | FullParticipantType;
  version: { major: number; minor: number };
}) {
  return (
    <div className="grid grid-cols-3">
      {([0, 1, 2, 3, 4, 5] as const).map((i) => {
        const key = `item_${i}_image` as keyof typeof part.stats;
        const itemId = part.stats[`item_${i}`];
        return (
          <ItemPart
            key={key}
            itemId={itemId || undefined}
            major={version.major}
            minor={version.minor}
          />
        );
      })}
    </div>
  );
}

export function ItemPart({
  itemId,
  major,
  minor,
}: {
  itemId?: number;
  major: number;
  minor: number;
}) {
  const item = useSimpleItem({ id: itemId!, major, minor }).data;
  return (
    <div>
      {item && (
        <ItemPopover major={major} minor={minor} item_id={itemId}>
          <Image
            className="m-[1px] rounded-md"
            src={mediaUrl(item.image.file_30)}
            alt="Item image"
            height={30}
            width={30}
          />
        </ItemPopover>
      )}
      {!item && (
        <div className="m-[1px] h-[30px] w-[30px] rounded-md border border-white/30 bg-zinc-800/30"></div>
      )}
    </div>
  );
}

export function ChampionClump({
  part,
  major,
  minor,
}: {
  part: FullParticipantType | BasicParticipantType;
  major: number;
  minor: number;
}) {
  const champions = useBasicChampions();
  const [, setPickTurn] = usePickTurn();
  const champion = part?.champion_id ? champions[part?.champion_id] : undefined;
  const item = useSimpleItem({ id: part.stats.item_6, major, minor }).data;
  const roleBoundItem = useSimpleItem({
    id: part.role_bound_item,
    major,
    minor,
  }).data;
  const has_perks = !!(
    part.stats.perk_0_image_url && part.stats.perk_sub_style_image_url
  );
  if (!champion) return null;
  if (!part) return null;
  return (
    <div className="flex">
      <div>
        <div className="relative">
          <Image
            onMouseOver={() => setPickTurn(part._id)}
            src={mediaUrl(champion.image.file_40)}
            height={40}
            width={40}
            alt={`Champion Image: ${champion.name}`}
            className="w-auto"
          />
          {roleBoundItem && roleBoundItem?.image?.file_30 && (
            <div className="absolute -bottom-1 -left-1">
              <ItemPopover
                major={major}
                minor={minor}
                item_id={part.role_bound_item}
              >
                <Image
                  className="rounded-sm border border-zinc-600"
                  src={mediaUrl(roleBoundItem.image.file_30)}
                  width={18}
                  height={18}
                  alt="Role bound item"
                />
              </ItemPopover>
            </div>
          )}
        </div>
        <div className="flex">
          {has_perks ? (
            <>
              <Image
                src={part.stats.perk_0_image_url}
                width={20}
                height={20}
                alt={""}
              />
              <Image
                src={part.stats.perk_sub_style_image_url}
                width={20}
                height={20}
                alt={""}
              />
            </>
          ) : (
            <>
              <div
                title="No runes"
                className="h-[20px] w-[40px] bg-gradient-to-r from-blue-500 to-orange-800 opacity-30"
              />
            </>
          )}
        </div>
      </div>
      <div>
        <Image
          src={part.summoner_1_image || ""}
          width={20}
          height={20}
          alt={`Spell image: ${part?.summoner_1_id}`}
        />
        <Image
          src={part.summoner_2_image || ""}
          width={20}
          height={20}
          alt={`Spell image: ${part?.summoner_2_id}`}
        />
        {item && item?.image?.file_30 && (
          <Image
            src={mediaUrl(item.image.file_30)}
            width={20}
            height={20}
            alt={""}
          />
        )}
      </div>
    </div>
  );
}
