import { useBasicChampions, usePlayerSummary, useMajorPatches } from "@/hooks";
import type { PlayerChampionSummaryResponse } from "@/external/iotypes/player";
import Orbit from "@/components/general/spinner";
import Image from "@/compat/image";
import { mediaUrl } from "../utils";
import numeral from "numeral";
import { useState } from "react";
import clsx from "clsx";
import { subDays, startOfDay } from "date-fns";

type Timing = "30 days" | "60 days" | "season";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "cursor-pointer rounded border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-sky-500/50 bg-sky-900/40 text-sky-200"
          : "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-200"
      )}
    >
      {children}
    </button>
  );
}

export function PlayerChampionSummary({ puuid }: { puuid: string }) {
  const [isShowAll, setIsShowAll] = useState(false);
  const majorPatchesQuery = useMajorPatches();

  const [timing, setTiming] = useState<Timing>("30 days");
  const [season, setSeason] = useState<number>(13);
  const [queue, setQueue] = useState<undefined|number>(420);

  const today = startOfDay(Date.now());

  // Get available seasons from major patches
  const availableSeasons = majorPatchesQuery.data?.results.map(p => p.major).slice(0, 3) || [];

  let options;
  switch (timing) {
    case "30 days": {
      options = { start_datetime: subDays(today, 30) };
      break;
    }
    case "60 days": {
      options = { start_datetime: subDays(today, 60) };
      break;
    }
    case "season": {
      options = { season: season || availableSeasons[0] };
      break;
    }
  }

  const query = usePlayerSummary({
    puuid,
    end: isShowAll ? 1000 : 5,
    queue_in: queue ? [queue]: undefined,
    ...options,
  });
  const summaries = query.data;
  if (query.isLoading) {
    return <Orbit />;
  } else if (!summaries) {
    return <>No data found</>;
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        <FilterButton active={timing === "30 days"} onClick={() => setTiming("30 days")}>
          30 days
        </FilterButton>
        <FilterButton active={timing === "60 days"} onClick={() => setTiming("60 days")}>
          60 days
        </FilterButton>
        {availableSeasons.map((s) => (
          <FilterButton
            key={s}
            active={timing === "season" && season === s}
            onClick={() => { setTiming("season"); setSeason(s); }}
          >
            Season {s}
          </FilterButton>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <FilterButton active={queue === 420} onClick={() => setQueue(420)}>
          Solo/Duo
        </FilterButton>
        <FilterButton active={queue === 440} onClick={() => setQueue(440)}>
          Flex
        </FilterButton>
        <FilterButton active={queue === undefined} onClick={() => setQueue(undefined)}>
          All
        </FilterButton>
      </div>
      <div className="quiet-scroll mt-3 flex max-h-96 flex-wrap gap-2 overflow-y-auto">
        {summaries.data.length === 0 && (
          <div className="w-full py-8 text-center text-sm text-zinc-500">
            No games found for this timeframe and queue.
          </div>
        )}
        {summaries.data.map((summary) => (
          <PlayerChampionSummaryItem
            key={`${summary.champion_id}-${summary.count}`}
            summary={summary}
          />
        ))}
      </div>
      {!isShowAll && summaries.count > summaries.data.length && (
        <button
          onClick={() => setIsShowAll(true)}
          className="mt-2 w-full rounded py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-200 cursor-pointer"
        >
          View All
        </button>
      )}
    </div>
  );
}

function PlayerChampionSummaryItem({
  summary,
}: {
  summary: PlayerChampionSummaryResponse;
}) {
  const champions = useBasicChampions();
  const champ = champions[summary.champion_id];

  const total = summary.wins + summary.losses || 1;
  const winPct = (summary.wins / total) * 100;
  const lossPct = (summary.losses / total) * 100;

  const statGroups = [
    {
      label: "Offense",
      stats: [
        { label: "K/D/A", value: summary.kda },
        { label: "DPM", value: summary.dpm },
        { label: "Turret", value: summary.turret_dpm },
        { label: "Objective", value: summary.objective_dpm },
      ],
    },
    {
      label: "Defense",
      stats: [
        { label: "Taken/m", value: summary.dtpm },
        { label: "Taken/d", value: summary.dtpd },
      ],
    },
    {
      label: "Utility",
      stats: [
        { label: "GPM", value: summary.gpm },
        { label: "VSPM", value: summary.vspm },
      ],
    },
  ];

  return (
    <div className="w-44 rounded-lg border border-zinc-700/50 bg-zinc-800/40">
      <div className="flex items-center gap-2 p-2 pb-1.5">
        {champ && (
          <Image
            className="rounded-md"
            width={36}
            height={36}
            src={mediaUrl(champ.image.file_40)}
            alt={champ.name}
          />
        )}
        <div className="min-w-0">
          <div
            className="truncate text-sm font-semibold text-zinc-200"
            title={summary.champion}
          >
            {summary.champion}
          </div>
          <div className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">{summary.count}</span> games
          </div>
        </div>
      </div>

      <div className="mx-2 flex h-1.5 overflow-hidden rounded-full">
        <div
          style={{ width: `${winPct}%` }}
          title={`${numeral(winPct).format("0.0")}% win rate`}
          className="bg-emerald-500/70"
        />
        <div
          style={{ width: `${lossPct}%` }}
          title={`${numeral(lossPct).format("0.0")}% loss rate`}
          className="bg-red-500/60"
        />
      </div>

      <div className="space-y-1 p-2 pt-1.5">
        {statGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </div>
            {group.stats.map(({ label, value }, i) => (
              <div
                key={label}
                className={clsx(
                  "flex items-center justify-between rounded px-1 py-0.5 text-xs",
                  i % 2 === 0 ? "bg-zinc-700/20" : ""
                )}
              >
                <span className="text-zinc-400">{label}</span>
                <span className="font-medium tabular-nums text-zinc-200">
                  {numeral(value).format("0.00")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
