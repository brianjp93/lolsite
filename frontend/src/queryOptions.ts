import { queryOptions } from "@tanstack/react-query";
import api from "@/external/api/api";

export function getSummonerByPuuidQueryOptions(puuid: string) {
  return queryOptions({
    queryKey: ["summoner", "puuid", puuid],
    queryFn: () => api.player.getSummoner({ puuid }),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
