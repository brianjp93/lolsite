import { Link } from "@tanstack/react-router";
import type { Favorite } from "@/external/types";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useState } from "react";
import { useFavorites, useQueues, useSimpleSpectate } from "@/hooks";
import api from "@/external/api/api.ts";
import { useMutation } from "@tanstack/react-query";
import numeral from "numeral";

export function FavoriteList({ favorites }: { favorites: Favorite[] }) {
  const favoritesQuery = useFavorites({});
  const [order, setOrder] = useState<Favorite[]>([]);

  useEffect(() => {
    setOrder(favorites);
  }, [favorites]);

  const mutation = useMutation({
    mutationFn: (puuidList: string[]) => api.player.setFavoriteOrder(puuidList),
    onSuccess: () => favoritesQuery.refetch(),
  });

  const onReorder = (newOrder: Favorite[]) => {
    setOrder(newOrder);
  };

  return (
    <Reorder.Group axis="y" values={order} onReorder={onReorder}>
      {order.map((fav) => {
        return (
          <FavoriteItem
            key={fav.puuid}
            fav={fav}
            onPointerUp={() => mutation.mutate(order.map((x) => x.puuid))}
          />
        );
      })}
    </Reorder.Group>
  );
}

function FavoriteItem({
  fav,
  onPointerUp,
}: {
  fav: Favorite;
  onPointerUp: () => void;
}) {
  const controls = useDragControls();
  const spectate = useSimpleSpectate(fav.puuid, fav.region).data;

  return (
    <Reorder.Item
      dragListener={false}
      dragControls={controls}
      className="touch-none select-none"
      value={fav}
    >
      <div className="flex">
        <div
          onPointerUp={onPointerUp}
          className="my-auto cursor-grab"
          onPointerDown={(e) => controls.start(e)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </div>
        <Link
          className="flex cursor-pointer px-2 py-1 hover:underline"
          to="/puuid/$puuid"
          params={{ puuid: fav.puuid }}
        >
          <div className="mr-2 font-bold">{fav.region}</div>
          {spectate && (
            <InGameDot
              queueId={spectate.gameQueueConfigId}
              startTime={spectate.gameStartTime}
            />
          )}
          {fav.riot_id_name && fav.riot_id_tagline ? (
            <div title={`${fav.riot_id_name}#${fav.riot_id_tagline}`}>
              {fav.riot_id_name}
            </div>
          ) : (
            <div>{fav.name}</div>
          )}
        </Link>
      </div>
    </Reorder.Item>
  );
}

export function InGameDot({
  queueId,
  startTime,
}: {
  queueId: number;
  startTime: number;
}) {
  const queues = useQueues().data;
  const queue = queues?.[queueId || -1]?.description || "";
  const now = new Date().getTime();
  const ms = now - startTime || 0;
  const total_seconds = Math.round(ms / 1000);
  const minutes = Math.floor(total_seconds / 60);
  const seconds = total_seconds % 60;

  return (
    <>
      <div
        className="mr-1 flex h-full"
        title={`In game: ${queue} ${minutes}:${numeral(seconds).format("00")}`}
      >
        <div className="my-auto h-4 w-4 rounded-full border-2 border-green-300/80 bg-green-700/70" />
      </div>
    </>
  );
}
