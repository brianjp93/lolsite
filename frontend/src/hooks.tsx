import { useState, useEffect, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import api from "@/external/api/api.ts";

import type {
  ChampionType,
  RuneType,
  BasicChampionWithImageType,
} from "@/external/types";
import type { QueueType, SimpleItem } from "./external/iotypes/data";

export function useDebounce<V>(value: V, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export const userKey = ["my-user"];
export function useUser() {
  const userQuery = useQuery({
    queryKey: userKey,
    queryFn: api.player.getMyUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });
  return userQuery;
}

export function useItem({
  id,
  major,
  minor,
}: {
  id: number;
  major: number | string;
  minor: number | string;
}) {
  return useQuery({
    queryKey: ["item", id, major, minor],
    queryFn: () =>
      api.data
        .getItem({ item_id: id, major, minor })
        .then((response) => response.data.data),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAllItems({
  major,
  minor,
  patch,
  map_id,
  options,
}: {
  major?: number | string;
  minor?: number | string;
  patch?: number | string;
  map_id?: number;
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.data.items>>>,
    "queryKey" | "queryFn"
  >;
}) {
  return useQuery({
    queryKey: ["all-items"],
    queryFn: () => api.data.items({ major, minor, patch, map_id }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useItemHistory(itemId: string) {
  return useQuery({
    queryKey: ["item-history", itemId],
    queryFn: () => api.data.getItemDiff(itemId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
    enabled: !!itemId,
  });
}

export function useMajorPatches() {
  return useQuery({
    queryKey: ["major-patches"],
    queryFn: () => api.match.getMajorPatches(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSimpleItems({
  major,
  minor,
  options,
}: {
  major: number | string;
  minor: number | string;
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.data.getSimpleItemList>>>,
    "queryKey" | "queryFn"
  >;
}) {
  return useQuery({
    queryKey: ["simple-items", major, minor],
    queryFn: () => api.data.getSimpleItemList(major, minor),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}

export function useSimpleItem({
  id,
  major,
  minor,
}: {
  id: number | null;
  major: number | string;
  minor: number | string;
}) {
  const itemsQ = useSimpleItems({
    major,
    minor,
    options: {
      enabled: !!id,
    },
  });
  const output = useMemo(() => {
    return itemsQ.data?.results.reduce(
      (prev, curr) => {
        prev[curr._id] = curr;
        return prev;
      },
      {} as Record<number, SimpleItem>,
    );
  }, [itemsQ.data]);
  const item = output?.[id!];
  return {
    ...itemsQ,
    data: item,
  };
}

export function useChampions(): Record<number, ChampionType> {
  const championQuery = useQuery({
    queryKey: ["champions"],
    queryFn: () => api.data.getChampions().then((x) => x.data.data),
    retry: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });
  const champions: Record<number, ChampionType> = {};
  for (const champ of championQuery.data || []) {
    champions[champ.key] = champ;
  }
  return champions;
}

export function useBasicChampions(): Record<
  number,
  BasicChampionWithImageType
> {
  const championQuery = useQuery({
    queryKey: ["basic-champions"],
    queryFn: () => api.data.basicChampions().then((x) => x.results),
    retry: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });
  const champions: Record<number, BasicChampionWithImageType> = {};
  for (const champ of championQuery.data || []) {
    champions[champ.key] = champ;
  }
  return champions;
}

export function useRunes(version: string) {
  const runesQuery = useQuery({
    queryKey: ["runes", version],
    queryFn: () => api.data.getRunes({ version }),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
  const runes: Record<number, RuneType> = {};
  for (const rune of runesQuery.data || []) {
    runes[rune._id] = rune;
  }
  return runes;
}

export function useSummonerSearch({
  name,
  region,
}: {
  name: string;
  region: string;
}) {
  name = name.split(/\s+/).join("");
  const query = useQuery({
    queryKey: ["summoner-search", name, region],
    queryFn: () =>
      api.player.summonerSearch({
        simple_riot_id__startswith: name.toLowerCase(),
        region,
      }),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    enabled: name.length > 0,
  });
  return query;
}

export function useMatch(matchId: string) {
  const matchQuery = useQuery({
    queryKey: ["full-match", matchId],
    queryFn: () => api.match.getMatch(matchId),
    retry: true,
    refetchOnWindowFocus: false,
    enabled: !!matchId,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 10,
  });
  return matchQuery;
}

export function useParticipants(matchId: string) {
  const participantQuery = useQuery({
    queryKey: ["participants", matchId],
    queryFn: () =>
      api.match
        .participants({ match__id: matchId, apply_ranks: true })
        .then((response) => response.data),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!matchId,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 10,
  });
  return participantQuery;
}

export function useMatchList(
  {
    riot_id_name,
    riot_id_tagline,
    region,
    start,
    limit,
    sync,
    queue,
    playedWith,
    keepPreviousData = true,
  }: {
    riot_id_name: string;
    riot_id_tagline: string;
    region: string;
    start: number;
    limit: number;
    sync: boolean;
    queue?: number;
    playedWith?: string;
    keepPreviousData?: boolean;
  },
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof api.match.getMatchesByRiotIdName>>["results"]
    >,
    "queryKey" | "queryFn"
  >,
) {
  const query = useQuery({
    queryKey: [
      "matches-with-sync",
      "by-summoner",
      riot_id_name,
      riot_id_tagline,
      region,
      start,
      limit,
      sync,
      queue,
      playedWith,
    ],
    queryFn: () =>
      api.match
        .getMatchesByRiotIdName({
          riot_id_name,
          riot_id_tagline,
          region,
          start,
          limit,
          queue,
          playedWith,
          sync_import: sync,
        })
        .then((x) => x.results),
    retry: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData
      ? (previousData) => previousData
      : undefined,
    staleTime: 1000 * 60 * 3,
    enabled: !!riot_id_name && !!region && !!riot_id_tagline,
    ...options,
  });
  return query;
}

export function useTimeline({ matchId }: { matchId: string }) {
  return useQuery({
    queryKey: ["timeline", matchId],
    queryFn: async () => {
      const response = await api.match.timeline(matchId);
      response.frames.sort((a, b) => a.timestamp - b.timestamp);
      return response;
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!matchId,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 30,
  });
}

export function useQueues() {
  return useQuery({
    queryKey: ["queues-data"],
    queryFn: async () => {
      const data = await api.data.getQueues();
      const out: Record<number, QueueType> = {};
      for (const x of data) {
        x.description = x.description.replace("games", "").trim();
        if (x.description === "Co-op vs. AI Intermediate Bot") {
          x.description = "Co-op vs Bots Int";
        }
        out[x._id] = x;
      }
      return out;
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSummoner(
  {
    region,
    riotIdName,
    riotIdTagline,
  }: {
    region: string;
    riotIdName: string;
    riotIdTagline: string;
  },
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.player.getSummonerByRiotId>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["summoner", "name", riotIdName, riotIdTagline, region],
    queryFn: () =>
      api.player.getSummonerByRiotId(riotIdName, riotIdTagline, region),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!region && !!riotIdName && !!riotIdTagline,
    ...options,
  });
}

export function usePositions(
  {
    riot_id_name,
    riot_id_tagline,
    region,
  }: {
    riot_id_name: string;
    riot_id_tagline: string;
    region: string;
  },
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.player.getPositions>>>,
    "queryKey" | "queryFn"
  >,
) {
  const query = useQuery({
    queryKey: ["positions", riot_id_name, riot_id_tagline, region],
    queryFn: () =>
      api.player.getPositions({ riot_id_name, riot_id_tagline, region }),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!riot_id_name && !!riot_id_tagline && !!region,
    ...options,
  });
  return query;
}

export function useNameChanges(
  {
    riot_id_name,
    riot_id_tagline,
    region,
  }: {
    riot_id_name: string;
    riot_id_tagline: string;
    region: string;
  },
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.player.getNameChanges>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["name-change", riot_id_name, riot_id_tagline, region],
    queryFn: () =>
      api.player.getNameChanges({ riot_id_name, riot_id_tagline, region }),
    enabled: !!riot_id_name && !!riot_id_tagline && !!region,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
  });
}

const banQueryKey = (match_id: string) => ["match-bans", match_id];
export function useBans(match_id: string) {
  return useQuery({
    queryKey: banQueryKey(match_id),
    queryFn: () => api.match.bans(match_id),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
}

export function useFavorites({ enabled = true }: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.player.getFavorites(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
    enabled,
  });
}

export function usePlayerSummary({
  puuid,
  start = 0,
  end = 5,
  order_by = "-count",
  start_datetime,
  end_datetime,
  season,
  queue_in,
}: {
  puuid: string;
  start?: number;
  end?: number;
  order_by?: string;
  start_datetime?: Date;
  end_datetime?: Date;
  season?: number;
  queue_in?: number[];
}) {
  return useQuery({
    queryKey: [
      "player-summary",
      puuid,
      start,
      end,
      start_datetime,
      end_datetime,
      season,
      queue_in ? queue_in.join(",") : queue_in,
    ],
    queryFn: () =>
      api.player.getChampionsOverview({
        puuid,
        start,
        end,
        order_by,
        start_datetime,
        end_datetime,
        season,
        queue_in,
      }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
    enabled: !!puuid,
  });
}

export function useSimpleSpectate(puuid: string, region: string) {
  return useQuery({
    queryKey: ["simple-spectate", puuid, region],
    queryFn: () =>
      api.match.checkForLiveGame({ puuid, region }).then((response) => {
        if (response === "not found") {
          return null;
        }
        return response;
      }),
    refetchInterval: 1000 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!(puuid && region),
  });
}

export function useConnectedSummoners() {
  return useQuery({
    queryKey: ["connected-summoners"],
    queryFn: () => api.player.getConnectedAccounts(),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSuspiciousAccount(puuid: string, enabled = true) {
  return useQuery({
    queryKey: ["sus-account", puuid],
    queryFn: () => api.player.isSuspicious(puuid),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: enabled,
  });
}

export function useSpectate(
  region: string,
  puuid: string,
  refetchInterval?: number,
  enabled?: boolean,
) {
  return useQuery({
    queryKey: ["spectate", region, puuid],
    queryFn: () =>
      api.match.getSpectate({ region, puuid }).then((x) => {
        if (x === "not found") {
          return null;
        }
        return x;
      }),
    retry: false,
    refetchInterval,
    enabled,
  });
}

export function useComment(pk: number) {
  return useQuery({
    queryKey: ["comment", pk],
    queryFn: () => api.player.getComment(pk),
    staleTime: 1000 * 3600 * 24,
  });
}

export function useGoogleRecaptchaSiteKey() {
  return useQuery({
    queryKey: ["google-recaptcha-site-key"],
    queryFn: api.data.getGoogleRecaptchaSiteKey,
    retry: true,
    staleTime: 1000 * 3600,
  });
}

export function useFollowList({ enabled }: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["followList"],
    queryFn: () => api.player.getFollowList(),
    enabled,
  });
}
