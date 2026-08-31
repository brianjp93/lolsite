import api from "@/external/api/api";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/$region/$searchName/$match/summary");

export default function MatchSummary() {
  const { match: matchId } = routeApi.useParams();
  const query = useQuery({
    queryKey: ["matchSummary", matchId],
    queryFn: () => {
      return api.match.getMatchSummary(matchId);
    },
    retry: false,
    enabled: !!matchId,
    refetchInterval: (query) => {
      if (!query.state.data || query.state.data.status === "r") {
        return 3000;
      }
      return false;
    },
    staleTime: 10000000,
  });
  return (
    <div className="h-screen">
      {(query.isLoading || query.data?.status === "r") && "loading..."}
      {query.data && (
        <>
          <textarea
            readOnly
            value={query.data.content}
            className="w-full h-full bg-black p-8"
          />
        </>
      )}
    </div>
  );
}
