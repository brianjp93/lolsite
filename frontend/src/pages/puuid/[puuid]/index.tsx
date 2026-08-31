import { useQuery } from "@tanstack/react-query";
import Skeleton from "@/components/general/skeleton";
import { getSummonerByPuuidQueryOptions } from "@/queryOptions";
import { Navigate, getRouteApi } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/general/loadingScreen";

const routeApi = getRouteApi("/puuid/$puuid");

export default function PuuidPage() {
  const { puuid } = routeApi.useParams();
  const summonerQuery = useQuery({
    ...getSummonerByPuuidQueryOptions(puuid),
    enabled: !!puuid,
    refetchOnMount: false,
  });

  const summoner = summonerQuery.data;
  if (summoner) {
    return (
      <Navigate
        to="/$region/$searchName"
        params={{
          region: summoner.region,
          searchName: summoner.riot_id,
        }}
        replace
      />
    );
  }

  return (
    <Skeleton>
      {summonerQuery.isError ? (
        "Summoner not found."
      ) : (
        <LoadingScreen message="Loading Summoner..." />
      )}
    </Skeleton>
  );
}
