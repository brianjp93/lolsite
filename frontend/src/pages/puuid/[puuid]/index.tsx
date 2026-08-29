import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Skeleton from "@/components/general/skeleton";
import { getSummonerByPuuidQueryOptions } from "@/queryOptions";
import { profileRoute } from "@/routes";
import { useRouter } from "@/compat/router";
import { LoadingScreen } from "@/components/general/loadingScreen";

export default function PuuidPage() {
  const router = useRouter();
  const puuid = router.query.puuid as string;
  const summonerQuery = useQuery({
    ...getSummonerByPuuidQueryOptions(puuid),
    enabled: !!puuid,
    refetchOnMount: false,
  });

  useEffect(() => {
    const summoner = summonerQuery.data;
    if (!summoner) return;
    void router.replace(
      profileRoute({
        region: summoner.region,
        riotIdName: summoner.riot_id_name,
        riotIdTagline: summoner.riot_id_tagline,
      }),
    );
  }, [router, summonerQuery.data]);

  return (
    <Skeleton>
      {summonerQuery.isError ? "Summoner not found." : <LoadingScreen message="Loading Summoner..." />}
    </Skeleton>
  );
}
