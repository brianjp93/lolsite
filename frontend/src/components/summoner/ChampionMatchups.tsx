import { useEffect, useId, useRef, useState } from "react";
import { startOfDay, startOfYear, subDays } from "date-fns";
import clsx from "clsx";
import { useBasicChampions, useChampionMatchups } from "@/hooks";
import Image from "@/compat/image";
import { RoleIcon } from "@/components/icons";
import { mediaUrl } from "../utils";

const timeRanges = [30, 60, 90, "year"] as const;
const positions = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

export function ChampionMatchups({ puuid }: { puuid: string }) {
  const [timeRange, setTimeRange] = useState<(typeof timeRanges)[number]>(30);
  const [championName, setChampionName] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<(typeof positions)[number] | null>(null);
  const [isChampionSearchOpen, setChampionSearchOpen] = useState(false);
  const [highlightedChampion, setHighlightedChampion] = useState(-1);
  const championListRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const champions = useBasicChampions();
  const championOptions = Object.values(champions).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const search = championName.trim().toLowerCase();
  const selectedChampion = championOptions.find(
    (champion) => champion.name.toLowerCase() === search,
  );
  const suggestions = championOptions.filter((champion) =>
    champion.name.toLowerCase().includes(search),
  );

  useEffect(() => {
    if (isChampionSearchOpen && highlightedChampion >= 0) {
      championListRef.current?.children[highlightedChampion]?.scrollIntoView({ block: "nearest" });
    }
  }, [isChampionSearchOpen, highlightedChampion]);

  function selectChampion(name: string) {
    setChampionName(name);
    setChampionSearchOpen(false);
    setHighlightedChampion(-1);
  }
  const today = startOfDay(new Date());
  const start = timeRange === "year" ? startOfYear(today) : subDays(today, timeRange);
  const query = useChampionMatchups({ puuid, start_dt: start.toISOString() });
  const matchups = (query.data ?? []).filter(
    (matchup) =>
      (!selectedPosition || matchup.individual_position === selectedPosition) &&
      (!championName.trim() || matchup.champion_id === selectedChampion?.key),
  );

  return (
    <section className="rounded-md bg-zinc-800 p-3" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="mb-3 font-semibold">Champion Matchups</h2>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Matchup time range">
        {timeRanges.map((range) => (
          <button
            key={range}
            type="button"
            aria-pressed={timeRange === range}
            onClick={() => setTimeRange(range)}
            className={clsx(
              "cursor-pointer rounded border px-2 py-1 text-xs font-medium transition-colors",
              timeRange === range
                ? "border-sky-500/50 bg-sky-900/40 text-sky-200"
                : "border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200",
            )}
          >
            {range === "year" ? "This year" : `${range} days`}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Matchup position">
        {positions.map((position) => (
          <button
            key={position}
            type="button"
            aria-label={position === "UTILITY" ? "SUPPORT" : position}
            title={position === "UTILITY" ? "SUPPORT" : position}
            aria-pressed={selectedPosition === position}
            onClick={() => setSelectedPosition((current) => current === position ? null : position)}
            className={clsx(
              "cursor-pointer rounded border p-2 transition-colors",
              selectedPosition === position
                ? "border-sky-500/50 bg-sky-900/40 text-sky-200"
                : "border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200",
            )}
          >
            <RoleIcon position={position} className="size-6" />
          </button>
        ))}
      </div>
      <label htmlFor={`${id}-champion`} className="mt-3">Your champion</label>
      <div className="relative">
        <input
          id={`${id}-champion`}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isChampionSearchOpen}
          aria-controls={`${id}-champions`}
          aria-activedescendant={
            isChampionSearchOpen && highlightedChampion >= 0
              ? `${id}-champion-${highlightedChampion}`
              : undefined
          }
          value={championName}
          onChange={(event) => {
            setChampionName(event.target.value);
            setChampionSearchOpen(true);
            setHighlightedChampion(-1);
          }}
          onFocus={() => setChampionSearchOpen(true)}
          onClick={() => setChampionSearchOpen(true)}
          onBlur={() => {
            setChampionSearchOpen(false);
            setHighlightedChampion(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setChampionSearchOpen(false);
              setHighlightedChampion(-1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setChampionSearchOpen(true);
              if (suggestions.length === 0) return;
              setHighlightedChampion((index) =>
                event.key === "ArrowDown"
                  ? Math.min(index + 1, suggestions.length - 1)
                  : index < 0 ? suggestions.length - 1 : Math.max(index - 1, 0),
              );
            } else if (event.key === "Enter" && isChampionSearchOpen) {
              const champion = suggestions[Math.max(highlightedChampion, 0)];
              if (champion) {
                event.preventDefault();
                selectChampion(champion.name);
              }
            }
          }}
          placeholder="Search champions…"
          autoComplete="off"
          className="h-9 w-full pb-1 text-sm"
        />
        {isChampionSearchOpen && (
          <ul
            id={`${id}-champions`}
            ref={championListRef}
            role="listbox"
            aria-label="Champions"
            onMouseDown={(event) => event.preventDefault()}
            className="quiet-scroll absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-zinc-700 bg-zinc-900 shadow-lg"
          >
            {suggestions.map((champion, index) => (
              <li
                key={champion.key}
                id={`${id}-champion-${index}`}
                role="option"
                aria-selected={highlightedChampion === index}
                onClick={() => selectChampion(champion.name)}
                className={clsx(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-zinc-700",
                  highlightedChampion === index && "bg-zinc-700",
                )}
              >
                {champion.name}
              </li>
            ))}
            {suggestions.length === 0 && (
              <li role="option" aria-disabled="true" className="px-3 py-2 text-sm text-zinc-400">
                No champions found.
              </li>
            )}
          </ul>
        )}
      </div>
      <div
        className="quiet-scroll mt-3 max-h-96 overflow-y-auto"
        role="region"
        aria-label="Champion matchup results"
        aria-busy={query.isFetching}
        tabIndex={0}
      >
        {query.isLoading ? (
          <p role="status" className="py-4 text-center text-sm">Loading matchups…</p>
        ) : query.isError ? (
          <div role="alert" className="py-4 text-center text-sm">
            Could not load matchups.
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="ml-2 cursor-pointer underline"
            >
              Retry
            </button>
          </div>
        ) : matchups.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            {championName.trim() && !selectedChampion
              ? "Choose a champion from the search suggestions."
              : "No matchups found for these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-700/50">
            {matchups.map((matchup) => {
              const champion = champions[matchup.champion_id];
              const opponent = champions[matchup.opponent_champion_id];
              return (
                <li
                  key={`${matchup.champion_id}-${matchup.opponent_champion_id}-${matchup.individual_position}`}
                  className="py-3"
                >
                  <div className="flex items-center gap-1.5 text-sm">
                    {champion?.image.file_30 && (
                      <Image src={mediaUrl(champion.image.file_30)} alt="" width={30} height={30} className="rounded" />
                    )}
                    <span className="min-w-0 flex-1 truncate" title={champion?.name}>
                      {champion?.name ?? `Champion ${matchup.champion_id}`}
                    </span>
                    <span className="text-xs text-zinc-500">vs.</span>
                    {opponent?.image.file_30 && (
                      <Image src={mediaUrl(opponent.image.file_30)} alt="" width={30} height={30} className="rounded" />
                    )}
                    <span className="min-w-0 flex-1 truncate" title={opponent?.name}>
                      {opponent?.name ?? `Champion ${matchup.opponent_champion_id}`}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>{matchup.individual_position === "UTILITY" ? "SUPPORT" : matchup.individual_position || "Unknown role"}</span>
                    <span>{matchup.game_count} {matchup.game_count === 1 ? "game" : "games"}</span>
                    <span>{matchup.win_count}W–{matchup.game_count - matchup.win_count}L</span>
                    <span title="Win rate" className="font-semibold tabular-nums">
                      {(matchup.win_percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
