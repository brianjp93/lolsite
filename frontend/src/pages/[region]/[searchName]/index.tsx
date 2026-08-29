import { useCallback, useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  useMatchList,
  useNameChanges,
  usePositions,
  useSummoner,
} from "@/hooks";
import Skeleton from "@/components/general/skeleton";
import Orbit from "@/components/general/spinner";
import { Pagination } from "@/components/general/Pagination";
import MatchCard from "@/components/summoner/matchCard";
import SummonerNotFound from "@/components/summoner/summonerNotFound";
import type { BasicMatchType } from "@/external/types";
import type { SummonerSearch } from "@/searchParams";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlayerMultiSelect } from "@/components/general/PlayerMultiSelect";
import { ProfileCardInner } from "@/components/summoner/matchDetails/profileCard";
import { RecentlyPlayedWith } from "@/components/summoner/recentlyPlayedWith";
import { PlayerChampionSummary } from "@/components/summoner/PlayerChampionSummary";
import { MatchListSummary } from "@/components/summoner/SummonerSummary";
import { getRiotIdAndTaglineFromSearchName } from "@/utils/constants";
import { SummonerNote } from "@/components/summoner/summonerNote";
import { keepPreviousData } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/general/loadingScreen";

export default function SummonerPage() {
  const { region, searchName } = useParams({ from: "/$region/$searchName" });
  const search = useSearch({ from: "/$region/$searchName" });

  const [riot_id_name, riot_id_tagline] =
    getRiotIdAndTaglineFromSearchName(searchName);

  const page = search.page ?? 1;
  const queue = search.queue;
  const playedWith = search.playedWith ?? "";
  const limit = 10;
  const start = limit * page - limit;

  const summonerQuery = useSummoner({
    region,
    riotIdName: riot_id_name,
    riotIdTagline: riot_id_tagline,
  });
  const matchQuery = useMatchList({
    riot_id_name,
    riot_id_tagline,
    region,
    start,
    limit,
    sync: true,
    queue,
    playedWith,
  });
  const positionsQuery = usePositions({
    riot_id_name,
    riot_id_tagline,
    region,
  });
  const nameChangesQuery = useNameChanges({
    riot_id_name,
    riot_id_tagline,
    region,
  });

  const loading =
    summonerQuery.isLoading ||
    matchQuery.isLoading ||
    positionsQuery.isLoading ||
    nameChangesQuery.isLoading;

  if (positionsQuery.isError) {
    return <Skeleton>
      <div>There was an error while trying to fetch the summoner.</div>
    </Skeleton>
  }

  if (loading) {
    return (
      <Skeleton>
        <LoadingScreen message="Loading Summoner data..." />
      </Skeleton>
    );
  }

  return <Summoner />;
}

function Summoner() {
  const { region, searchName } = useParams({ from: "/$region/$searchName" });
  const search = useSearch({ from: "/$region/$searchName" });
  const navigate = useNavigate({ from: "/$region/$searchName" });
  const [riot_id_name, riot_id_tagline] =
    getRiotIdAndTaglineFromSearchName(searchName);

  const page = search.page ?? 1;
  const queue = search.queue;
  const playedWith = search.playedWith ?? "";

  const setSearch = useCallback(
    (patch: Partial<SummonerSearch>) => {
      void navigate({
        search: (prev) => ({ ...prev, ...patch }),
        resetScroll: false,
      });
    },
    [navigate],
  );
  const limit = 10;
  const start = limit * page - limit;
  const summonerQuery = useSummoner(
    {
      region,
      riotIdName: riot_id_name,
      riotIdTagline: riot_id_tagline,
    },
    {
      refetchInterval: (query) =>
        query.state.data?.summoner_level === 0 ? 3_000 : false,
    },
  );
  const summoner = summonerQuery.data;

  const matchQuery = useMatchList(
    {
      riot_id_name,
      riot_id_tagline,
      region,
      start,
      limit,
      sync: true,
      queue,
      playedWith,
    },
    { placeholderData: keepPreviousData },
  );

  const positionsQuery = usePositions({
    riot_id_name,
    riot_id_tagline,
    region,
  });
  const nameChangesQuery = useNameChanges({
    riot_id_name,
    riot_id_tagline,
    region,
  });
  const matches: BasicMatchType[] = matchQuery.data || [];

  const isLoading = matchQuery.isLoading || summonerQuery.isLoading;

  return (
    <Skeleton topPad={0}>
      <div style={{ minHeight: 1000 }} className="mx-auto flex-col">
        {searchName.indexOf("-") === -1 && (
          <div className="mt-4 flex flex-col gap-y-2">
            <div className="mb-4">Error while searching for summoner.</div>
            <div>
              Riot has updated summoner names to use your RiotIdName +
              RiotTagline.
            </div>
            <div>
              Make sure to search for your name, using a &quot;#&quot; between
              your name and tagline.
            </div>
            <div className="mt-4">
              Ex:
              <span className="ml-2 font-bold">yourName#tagline</span>
            </div>
          </div>
        )}
        {!isLoading && summoner && (
          <div className="flex">
            <ProfileCardInner
              summoner={summoner}
              positions={positionsQuery.data || []}
              nameChanges={nameChangesQuery.data || []}
            />
            <SummonerNote summoner={summoner} />
          </div>
        )}

        {summonerQuery.isError && !summonerQuery.isFetching && (
          <SummonerNotFound />
        )}

        {matchQuery.isSuccess && summonerQuery.isSuccess && (
          <div className="flex">
            <div>
              {!isLoading && summoner && (
                <>
                  <div className="max-w-237.5 my-2 w-full rounded-md bg-zinc-800 p-4">
                    <PlayerChampionSummary puuid={summoner.puuid} />
                  </div>
                </>
              )}
              <div className="my-2 w-full">
                <MatchFilter
                  region={region}
                  onSubmit={(data) => {
                    const queue = data.queue ? Number(data.queue) : undefined;
                    setSearch({
                      queue: Number.isFinite(queue) ? queue : undefined,
                      playedWith: data.playedWith || undefined,
                    });
                  }}
                />
              </div>
              <div>
                <Pagination
                  page={page}
                  loading={matchQuery.isFetching}
                  onPageChange={(p) => setSearch({ page: p })}
                />
                {isLoading && (
                  <div style={{ width: 600 }}>
                    <Orbit size={200} className="m-auto" />
                  </div>
                )}
                {!isLoading && summoner && (
                  <div className="flex">
                    <div>
                      <div className="my-2 w-full">
                        <MatchListSummary
                          matches={matches}
                          summoner={summoner}
                          champCount={5}
                        />
                      </div>
                      {matches.map((match: BasicMatchType, key: number) => {
                        return (
                          <MatchCard
                            key={`${key}-${match._id}`}
                            match={match}
                            summoner={summoner}
                          />
                        );
                      })}
                    </div>
                    <div>
                      <div className="ml-2 hidden rounded-md bg-zinc-800 md:block">
                        <RecentlyPlayedWith
                          summoner={summoner}
                          matches={matches}
                          region={region}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <Pagination
                  page={page}
                  loading={matchQuery.isFetching}
                  onPageChange={(p) => setSearch({ page: p })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Skeleton>
  );
}

const QUEUEFILTER = {
  420: "5v5 Ranked Solo/Duo",
  440: "5v5 Ranked Flex",
  400: "5v5 Norms Draft",
  430: "5v5 Norms Blind",
  490: "Normal (Quickplay)",
  1700: "2v2v2v2",
  0: "Custom Games",
  700: "Clash",
  720: "ARAM Clash",
  450: "ARAM",
  1900: "U.R.F.",
} as const;

const MatchFilterSchema = z.object({
  queue: z.number().optional(),
  playedWith: z.string().optional().default(""),
});
type MatchFilterSchema = z.infer<typeof MatchFilterSchema>;

function MatchFilter({
  className = "",
  region,
  onSubmit,
}: React.PropsWithChildren<{
  className?: string;
  region: string;
  onSubmit: (data: MatchFilterSchema) => void;
}>) {
  const { queue, playedWith } = useSearch({ from: "/$region/$searchName" });
  const { register, getValues, handleSubmit } = useForm<MatchFilterSchema>({
    resolver: zodResolver(MatchFilterSchema),
    defaultValues: { queue, playedWith },
  });

  const [playedWithNames, setPlayedWithNames] = useState<string[]>(() =>
    playedWith ? playedWith.split(",").filter(Boolean) : [],
  );

  const onChange = useCallback(async () => {
    onSubmit(getValues());
  }, [getValues, onSubmit]);

  const handlePlayedWithChange = useCallback(
    (names: string[]) => {
      setPlayedWithNames(names);
      onSubmit({ ...getValues(), playedWith: names.join(",") });
    },
    [getValues, onSubmit],
  );

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(() => null)}>
        <label htmlFor="queue" className="w-14">
          Queue
        </label>
        <select
          {...register("queue", { onChange })}
          className="default py-2! w-full rounded cursor-pointer"
        >
          <option value={undefined}>Any</option>
          {Object.keys(QUEUEFILTER).map((x) => {
            const queue = parseInt(x) as keyof typeof QUEUEFILTER;
            const name = QUEUEFILTER[queue];
            return (
              <option key={queue} value={queue}>
                {name}
              </option>
            );
          })}
        </select>
        <div className="my-2">
          <div className="mb-1">Played With</div>
          <PlayerMultiSelect
            region={region}
            value={playedWithNames}
            onChange={handlePlayedWithChange}
          />
        </div>
      </form>
    </div>
  );
}
