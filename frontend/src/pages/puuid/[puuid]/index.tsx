import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Skeleton from "@/components/general/skeleton";
import { getSummonerByPuuidQueryOptions } from "@/queryOptions";
import { getRouteApi } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/general/loadingScreen";

const routeApi = getRouteApi("/puuid/$puuid");

export default function PuuidPage() {
  const navigate = routeApi.useNavigate();
  const { puuid } = routeApi.useParams();
  const summonerQuery = useQuery({
    ...getSummonerByPuuidQueryOptions(puuid),
    enabled: !!puuid,
    refetchOnMount: false,
  });

  useEffect(() => {
    const summoner = summonerQuery.data;
    if (!summoner) return;
    void navigate({
      to: "/$region/$searchName",
      params: {
        region: summoner.region,
        searchName: summoner.riot_id,
      },
      replace: true,
    });
  }, [navigate, summonerQuery.data]);

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
