import { mediaUrl } from "@/components/utils";
import type { NameChangeType, PositionType } from "@/external/iotypes/player";
import type { SummonerType } from "@/external/types";
import {
  useFavorites,
  useFollowList,
  useNameChanges,
  usePositions,
  useQueues,
  useSpectate,
  useSummoner,
  useUser,
} from "@/hooks";
import Image from "@/compat/image";
import { getRouteApi } from "@tanstack/react-router";
import { Popover } from "react-tiny-popover";
import { useState } from "react";
import { QUEUE_CONVERT } from "@/utils/constants";
import numeral from "numeral";
import api from "@/external/api/api";
import { useMutation } from "@tanstack/react-query";
import { SpectateModal } from "../spectate";
import { UsersIcon } from "@/components/icons";
import { InGameDot } from "@/components/general/favoriteList";
import clsx from "clsx";

const routeApi = getRouteApi("/$region/$searchName");

export function ProfileCard({ className = "" }: { className: string }) {
  const params = routeApi.useParams();
  const {
    region,
    riot_id_name: riotIdName = "",
    riot_id_tagline: riotIdTagline = "",
  } = params;
  const summonerQ = useSummoner({ region, riotIdName, riotIdTagline });
  const summoner = summonerQ.data;
  const positionQ = usePositions({
    riot_id_name: riotIdName,
    riot_id_tagline: riotIdTagline,
    region,
  });
  const positions = positionQ.data;
  const nameChangeQuery = useNameChanges({
    riot_id_name: riotIdName,
    riot_id_tagline: riotIdTagline,
    region,
  });
  const nameChanges = nameChangeQuery.data || [];
  if (!summoner) return null;
  return (
    <div className={className}>
      <ProfileCardInner
        summoner={summoner}
        positions={positions}
        nameChanges={nameChanges}
      />
    </div>
  );
}

export function FollowButton({ summoner }: { summoner: SummonerType }) {
  const user = useUser().data;
  const followQ = useFollowList({ enabled: !!user });
  const following = followQ.data || [];
  const isFollow = following.map((x) => x.id).includes(summoner.id);

  const setFollowM = useMutation({
    mutationFn: () => api.player.setFollow({ id: summoner.id }),
    onSuccess: () => followQ.refetch(),
  });
  const removeFollowM = useMutation({
    mutationFn: () => api.player.removeFollow({ id: summoner.id }),
    onSuccess: () => followQ.refetch(),
  });
  if (!user) {
    return null;
  }
  return (
    <div title="follow">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isFollow ? "currentColor" : "none"}
        onClick={() => {
          if (isFollow) removeFollowM.mutate();
          else setFollowM.mutate();
        }}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke={isFollow ? "black" : "currentColor"}
        className="h-6 w-6 hover:cursor-pointer"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    </div>
  );
}

export function FavoriteButton({ summoner }: { summoner: SummonerType }) {
  const user = useUser().data;
  const favoritesQuery = useFavorites({ enabled: !!user });
  const favorites = favoritesQuery.data || [];
  const isFavorite = !!favorites.filter((x) => x.puuid === summoner.puuid)?.[0];

  const setFavorite = useMutation({
    mutationFn: () => api.player.setFavorite(summoner.id),
    onSuccess: () => {
      favoritesQuery.refetch();
    },
  });
  const removeFavorite = useMutation({
    mutationFn: () => api.player.removeFavorite(summoner.id),
    onSuccess: () => {
      favoritesQuery.refetch();
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div title="favorite">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isFavorite ? "currentColor" : "none"}
        onClick={
          isFavorite
            ? () => removeFavorite.mutate()
            : () => setFavorite.mutate()
        }
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6 hover:cursor-pointer"
        tabIndex={1}
        role="button"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </div>
  );
}

export function ProfileCardInner({
  summoner,
  positions = [],
  nameChanges = [],
}: {
  summoner: SummonerType;
  positions?: PositionType[];
  nameChanges?: NameChangeType[];
}) {
  const [isNameChangeOpen, setIsNameChangeOpen] = useState(false);
  const [isSpectateModalOpen, setIsSpectateModalOpen] = useState(false);

  const spectateQuery = useSpectate(
    summoner.region,
    summoner?.puuid,
    1000 * 60,
    !!summoner?.puuid,
  );
  const spectate = spectateQuery.data;
  const queues = useQueues().data || {};

  return (
    <div className="flex max-w-fit flex-col rounded bg-zinc-900 p-4 shadow-lg">
      <div className="flex">
        <div className="relative w-fit">
          <Image
            src={mediaUrl(summoner.profile_icon)}
            alt={`Summoner Icon: ${summoner.profile_icon_id}`}
            width={40}
            height={40}
            className="rounded"
          />
          <div className="-bottom-1.75 absolute flex w-full">
            <div className="mx-auto rounded-md bg-zinc-200 px-1 text-xs font-bold text-gray-900">
              {summoner.summoner_level}
            </div>
          </div>
        </div>
        <div className="ml-2 mr-4">
          <div className="flex">
            <div>
              <Popover
                isOpen={isNameChangeOpen}
                positions={["bottom"]}
                containerStyle={{ zIndex: "11", padding: "0" }}
                content={
                  <div className="rounded-lg bg-zinc-800/95 p-3 shadow-xl backdrop-blur-sm">
                    <div className="mb-2 border-b border-zinc-700 pb-2 text-sm font-bold text-white">
                      Old Names
                    </div>
                    {nameChanges.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {nameChanges.map((item, key) => {
                          return (
                            <div
                              key={key}
                              className="rounded px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-700/50"
                            >
                              {item.old_name}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-400">
                        No previous names
                      </div>
                    )}
                  </div>
                }
              >
                <div
                  onClick={() => setIsNameChangeOpen((x) => !x)}
                  className="flex cursor-pointer font-bold underline"
                >
                  <div>{summoner.riot_id_name}</div>
                  <div className="text-gray-600">
                    #{summoner.riot_id_tagline}
                  </div>
                </div>
              </Popover>
              {spectate ? (
                <SpectateModal
                  region={summoner.region}
                  puuid={summoner.puuid}
                  queueConvert={queues}
                  isSpectateModalOpen={isSpectateModalOpen}
                  setIsSpectateModalOpen={setIsSpectateModalOpen}
                >
                  <div className="flex text-sm hover:cursor-pointer">
                    <div>
                      <InGameDot
                        queueId={spectate.gameQueueConfigId}
                        startTime={spectate.gameStartTime}
                      />
                    </div>
                    Live Game
                  </div>
                </SpectateModal>
              ) : (
                <div className="text-sm">Not in game</div>
              )}
            </div>
            {summoner.has_match_overlap > 0 && (
              <div
                title={`Your connected accounts have ${summoner.has_match_overlap} overlapping games with this account.`}
                className="ml-2 mt-1"
              >
                <div className="relative">
                  <UsersIcon className="my-auto w-6" />
                  <div className="absolute -top-3 -right-4 rounded-sm bg-gray-600 px-1 text-xs">
                    {summoner.has_match_overlap}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto flex">
          <FavoriteButton summoner={summoner} />
          <FollowButton summoner={summoner} />
        </div>
      </div>
      {positions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {positions.map((x) => {
            const queue = QUEUE_CONVERT[x.queue_type] || x.queue_type;
            const total = x.wins + x.losses || 1;
            const winPct = (x.wins / total) * 100;
            return (
              <div
                key={x.id}
                className="rounded-md border border-zinc-700/50 bg-zinc-800/40 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {queue}
                  </span>
                  <span className="text-sm font-bold text-zinc-200">
                    {x.tier} {x.rank}
                    <span className="ml-1 font-normal text-zinc-400">
                      {x.league_points} LP
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-emerald-500/70"
                      style={{ width: `${winPct}%` }}
                    />
                    <div
                      className="bg-red-500/60"
                      style={{ width: `${100 - winPct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                    <span className="text-emerald-400">{x.wins}W</span>
                    {" / "}
                    <span className="text-red-400">{x.losses}L</span>
                    <span className="ml-1 font-semibold text-zinc-200">
                      {numeral(winPct).format("0.0")}%
                    </span>
                  </span>
                </div>
                {x.series_progress && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-500">
                      Promos
                    </span>
                    {[...x.series_progress].map((ch: string, key: number) => (
                      <div
                        key={key}
                        className={clsx("h-3 w-3 rounded-full border-2", {
                          "border-green-900 bg-green-600": ch === "W",
                          "border-red-900 bg-red-600": ch === "L",
                          "border-zinc-700 bg-zinc-800": ch === "N",
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
