import { useCallback } from "react";
import type { SummonerType } from "@/external/types";
import type { BasicParticipantType } from "@/external/iotypes/match";
import { puuidRoute } from "@/routes";
import { Link } from "@tanstack/react-router";

interface PlayerCount {
  count: number;
  puuid: string;
}

interface SortedPlayer {
  summoner_name: string;
  count: number;
  puuid: string;
}

interface RecentlyPlayedWithProps {
  summoner: SummonerType;
  matches: Array<{ participants: BasicParticipantType[] }>;
  region?: string;
}

export function RecentlyPlayedWith({
  summoner,
  matches,
}: RecentlyPlayedWithProps) {
  const countPlayers = useCallback(() => {
    const count: Record<string, PlayerCount> = {};
    for (const match of matches) {
      for (const p of match.participants) {
        const tagline = p.riot_id_tagline;
        const id_name = p.riot_id_name;
        const name = `${id_name}#${tagline}`;
        if (p.puuid === summoner.puuid) {
          continue;
        }
        if ([0, "0"].indexOf(p.puuid) >= 0) {
          continue;
        }
        if (count[name] === undefined) {
          count[name] = { count: 1, puuid: p.puuid };
        } else {
          const existing = count[name];
          if (existing) {
            existing.count += 1;
          }
        }
      }
    }
    return count;
  }, [matches, summoner.puuid]);

  const sortPlayers = useCallback(() => {
    const count_dict = countPlayers();
    const count_list: SortedPlayer[] = [];
    for (const name in count_dict) {
      const player = count_dict[name];
      if (player && player.count > 1) {
        count_list.push({
          summoner_name: name,
          count: player.count,
          puuid: player.puuid,
        });
      }
    }
    count_list.sort((a, b) => {
      return b.count - a.count;
    });
    return count_list;
  }, [countPlayers]);

  return (
    <div className="card-panel flex h-[200px] w-[270px] flex-col p-2">
      <div className="shrink-0">
        <span className="inline underline">Players In These Games</span>{" "}
        <small>{matches.length} games</small>
      </div>
      <div className="quiet-scroll mt-1 min-h-0 flex-1 overflow-y-auto">
        <div className="flex w-full flex-wrap">
          {sortPlayers().map((data, i) => {
            return (
              <div
                key={data.puuid}
                className={`flex w-full ${i % 2 === 0 ? "bg-white/5" : ""}`}
              >
                <div className="w-3/4 p-1 text-sm">
                  <Link
                    to={puuidRoute(data.puuid)}
                    className="cursor-pointer hover:underline"
                  >
                    {data.summoner_name}
                  </Link>
                </div>
                <div className="w-1/4 p-1 text-sm">{data.count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
