import { useState } from "react";
import { useConnectedSummoners } from "@/hooks";
import Orbit from "../general/spinner";
import { useMutation } from "@tanstack/react-query";
import api from "@/external/api/api";
import { Link } from "@tanstack/react-router";
import { myAccount } from "@/routes";
import clsx from "clsx";

export function CreateComment({
  onCancel,
  match_id,
  reply_to,
}: {
  onCancel: () => void;
  match_id: number;
  reply_to?: number;
}) {
  const [value, setValue] = useState("");
  const [selectedSummoner, setSelectedSummoner] = useState<string>();
  const connectedQ = useConnectedSummoners();
  const connected = connectedQ.data || [];

  const create = useMutation({
    mutationFn: (puuid: string) =>
      api.player.createComment({
        markdown: value,
        match: match_id,
        reply_to,
        summoner: puuid,
      }),
  });

  return (
    <div className="flex w-full flex-col gap-y-4 rounded bg-zinc-900/50 p-4">
      <textarea
        className="min-h-25 w-full rounded border border-zinc-700 bg-zinc-800 p-2 text-gray-200 outline-none focus:border-blue-500"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Write a comment..."
      />
      {connectedQ.isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Orbit size={20} />
          <div>Loading connected summoners...</div>
        </div>
      )}
      {!connectedQ.isLoading && connected.length === 0 && (
        <div className="text-sm text-gray-400">
          No Summoners connected. Please connect an account at
          <Link
            to={myAccount()}
            className="ml-1 text-blue-400 hover:underline"
          >
            my account
          </Link>
        </div>
      )}
      {!connectedQ.isLoading && connected.length > 0 && (
        <select
          className="w-full rounded border border-zinc-700 bg-zinc-800 p-2 text-gray-200 outline-none focus:border-blue-500"
          value={selectedSummoner || ""}
          onChange={(event) => setSelectedSummoner(event.currentTarget.value)}
        >
          <option value="" disabled>
            Select Summoner
          </option>
          {connected.map((x) => {
            return (
              <option key={x.puuid} value={x.puuid}>
                {x.riot_id_name}#{x.riot_id_tagline} ({x.region})
              </option>
            );
          })}
        </select>
      )}
      <div className="flex justify-end gap-x-2">
        <button onClick={() => onCancel()} className="btn btn-default">
          Cancel
        </button>
        <button
          onClick={() => {
            if (selectedSummoner && value) {
              create.mutate(selectedSummoner || "");
            }
          }}
          className={clsx("btn btn-primary", {
            disabled: !selectedSummoner || !value || create.isPending,
          })}
        >
          Create Comment
        </button>
      </div>
    </div>
  );
}

export function ViewComments() {
  return <></>;
}
