import type { BasicMatchType, SummonerType } from "@/external/types";
import { useBasicChampions, useMatchList, useSummoner } from "@/hooks";
import clsx from "clsx";
import Image from "@/compat/image";
import numeral from "numeral";
import Orbit from "../general/spinner";
import { mediaUrl } from "../utils";
import MatchCard from "./matchCard";

export function SummonerSummary({
  riotIdName,
  riotIdTagline,
  region,
}: {
  riotIdName: string;
  riotIdTagline: string,
  region: string;
}) {
  const query = useMatchList({
    riot_id_name: riotIdName,
    riot_id_tagline: riotIdTagline,
    region,
    start: 0,
    limit: 20,
    sync: true,
    queue: 420,
  });
  const summonerQ = useSummoner({ region, riotIdName, riotIdTagline });
  const summoner = summonerQ.data;
  const matches = query.data || [];
  if (query.isLoading) {
    return <Orbit />;
  }
  if (matches.length === 0) {
    return <div>No matches found</div>;
  }
  if (!summoner) {
    return <div>No summoner found.</div>;
  }
  return (
    <>
      <div>
        <MatchListSummary matches={matches} summoner={summoner} />
        {matches.map((match) => {
          return (
            <div key={match.id}>
              <MatchCard match={match} summoner={summoner} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function getChampionStats(matches: BasicMatchType[], puuid: string) {
  const champs: {
    [x: number]: {
      kills: number;
      deaths: number;
      assists: number;
      wins: number;
      losses: number;
    };
  } = {};
  const roles = {
    top: 0,
    jungle: 0,
    mid: 0,
    bot: 0,
    sup: 0,
  };
  let wins = 0;
  let losses = 0;
  for (const match of matches) {
    const winner = match.teams.filter((x) => x.win)[0];
    if (winner === undefined) {
      continue;
    }
    const part = match.participants.filter((x) => x.puuid === puuid)[0];
    if (part === undefined) {
      continue;
    }
    if (champs?.[part.champion_id] === undefined) {
      champs[part.champion_id] = {
        kills: 0,
        deaths: 0,
        assists: 0,
        wins: 0,
        losses: 0,
      };
    }
    if (part.team_position === "TOP") {
      roles.top += 1;
    } else if (part.team_position === "JUNGLE") {
      roles.jungle += 1;
    } else if (part.team_position === "MIDDLE") {
      roles.mid += 1;
    } else if (part.team_position === "BOTTOM") {
      roles.bot += 1;
    } else if (part.team_position === "UTILITY") {
      roles.sup += 1;
    }
    if (part.team_id === winner._id) {
      wins += 1;
      champs[part.champion_id]!.wins += 1;
    } else {
      losses += 1;
      champs[part.champion_id]!.losses += 1;
    }
    champs[part.champion_id]!.kills += part.stats.kills;
    champs[part.champion_id]!.deaths += part.stats.deaths;
    champs[part.champion_id]!.assists += part.stats.assists;
  }
  return { wins, losses, champs, roles };
}

export function MatchListSummary({
  matches,
  summoner,
  champCount = 3,
}: {
  matches: BasicMatchType[];
  summoner: SummonerType;
  champCount?: number;
}) {
  const { wins, losses, champs, roles } = getChampionStats(
    matches,
    summoner.puuid
  );
  const data = Object.entries(roles)
    .map(([key, val]) => {
      return { count: val, role: key };
    })
    .sort((a, b) => b.count - a.count);
  const champData = Object.entries(champs)
    .map(([key, val]) => {
      return { ...val, champId: key };
    })
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses));
  const basicChamp = useBasicChampions();
  return (
    <>
      <div className="flex rounded-md border border-zinc-800 bg-zinc-800/30 p-2">
        <div>
          <div className="mb-2 min-w-[120px]">
            <TwoPartBar leftAmount={wins} rightAmount={losses} />
            <div className="flex justify-between text-sm">
              <div>{wins} wins</div>
              <div>{losses} losses</div>
            </div>
          </div>

          <div className="mb-2">
            {data.map(({ role, count }) => {
              if (count === 0) return null;
              return (
                <div key={role}>
                  {role}: {count}
                </div>
              );
            })}
          </div>
        </div>

        <div className="ml-2 flex w-full">
          {champData.slice(0, champCount).map((x) => {
            const ch = basicChamp[parseInt(x.champId)];
            const kda = (x.kills + x.assists) / (x.deaths || 1);
            return (
              <div key={x.champId} className="mx-2">
                {ch && (
                  <div className="flex">
                    <Image
                      src={mediaUrl(ch.image.file_30)}
                      width={30}
                      height={30}
                      alt={ch.name}
                    />
                    <div className="ml-1 text-xs font-bold">{ch.name}</div>
                  </div>
                )}
                <div className="my-1">
                  <TwoPartBar leftAmount={x.wins} rightAmount={x.losses} />
                </div>
                <div
                  title={`${x.kills} kills / ${x.deaths} deaths / ${x.assists} assists`}
                >
                  KDA: {numeral(kda).format("0.00")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function TwoPartBar({
  leftAmount,
  rightAmount,
}: {
  leftAmount: number;
  rightAmount: number;
}) {
  const total = leftAmount + rightAmount;
  const leftP = (leftAmount / (total || 1)) * 100;
  const rightP = (rightAmount / (total || 1)) * 100;
  return (
    <div className="flex h-4 w-full">
      <div
        style={{ width: `${leftP}%` }}
        title={`${numeral(leftP).format("0.0")}% (${leftAmount})`}
        className={clsx(
          "h-full rounded-l-md bg-gradient-to-r from-green-700/50 to-green-400/70",
          {
            "rounded-r-md": leftP === 100,
          }
        )}
      ></div>
      <div
        style={{ width: `${rightP}%` }}
        title={`${numeral(rightP).format("0.0")}% (${rightAmount})`}
        className={clsx(
          "h-full rounded-r-md bg-gradient-to-r from-red-400/70 to-red-700/70",
          {
            "rounded-l-md": rightP === 100,
          }
        )}
      ></div>
    </div>
  );
}
