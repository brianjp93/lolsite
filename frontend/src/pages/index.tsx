import Skeleton from "@/components/general/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/external/api/api.ts";
import Modal from "react-modal";
import { SearchForm } from "@/components/general/searchForm";
import { staticUrl } from "@/utils/staticUrl";

Modal.setAppElement("#app");

export default function Home() {
  const quoteQuery = useQuery({
    queryKey: ["inspirational-quote"],
    queryFn: () => api.fun.getInspirationalMessage(),
    refetchInterval: 1000 * 5,
    refetchOnWindowFocus: false,
  });
  const quote = quoteQuery.data?.message;
  return (
    <Skeleton>
      <div className="mx-auto max-w-prose">
        <img
          className="m-auto mt-8"
          src={staticUrl("gen/hardstuck-by-hand_2.png")}
          alt="Hardstuck large logo."
          width={500}
          height={300}
        />
        <div className="mt-4" title={quote?.hidden_message}>
          {quote?.message}
          {quote?.author && (
            <div className="ml-4 opacity-60">- {quote?.author}</div>
          )}
        </div>
        <SearchForm formClass="mt-10" />
      </div>
    </Skeleton>
  );
}
