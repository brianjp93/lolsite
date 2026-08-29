import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGIONS } from "@/utils/constants";
import { useSummonerSearch } from "@/hooks";
import clsx from "clsx";
import type { SummonerType } from "@/external/types";

const SearchSchema = z.object({
  search: z.string().min(1, "Please give a summoner name."),
  region: z.enum(REGIONS),
});
type SearchSchema = z.infer<typeof SearchSchema>;

export function SearchForm({
  showButton = true,
  showLabel = true,
  inputClass = "",
  formClass = "",
}: {
  showButton?: boolean;
  showLabel?: boolean;
  inputClass?: string;
  formClass?: string;
}) {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<SearchSchema>({
    resolver: zodResolver(SearchSchema),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const name = watch("search") || "";
  const region = watch("region") || "na";
  const query = useSummonerSearch({
    name,
    region,
  });
  const ref = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [name]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (event.target instanceof Element) {
        if (!ref?.current?.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const onSubmit = handleSubmit((data) => {
    let search = data.search;
    if (data.search.indexOf("#") < 0) {
      search = search + "-NA1";
    } else {
      search = search.replace("#", "-");
    }
    void navigate({ to: `/${data.region}/${search}/` });
  });

  const handleSelect = (x: SummonerType) => {
    setValue("search", `${x.riot_id_name}#${x.riot_id_tagline}`);
    onSubmit();
    setIsOpen(false);
  };

  return (
    <form
      className={formClass}
      ref={formRef}
      autoComplete="off"
      onSubmit={onSubmit}
    >
      {showLabel && <label htmlFor="summoner-search">Search</label>}
      <div ref={ref} className="relative flex">
        <select {...register("region")}>
          {REGIONS.map((item) => {
            return (
              <option key={item} value={item}>
                {item}
              </option>
            );
          })}
        </select>
        <div className="relative flex w-full">
          {query.isLoading && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            </div>
          )}
          <input
            id="summoner-search"
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (!isOpen || !query.data?.length) return;
              const count = query.data.length;
              if (
                event.key === "ArrowDown" ||
                (event.key === "Tab" && !event.shiftKey)
              ) {
                event.preventDefault();
                setHighlightedIndex((i) => (i < count - 1 ? i + 1 : i));
              } else if (
                event.key === "ArrowUp" ||
                (event.key === "Tab" && event.shiftKey)
              ) {
                event.preventDefault();
                setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
              } else if (event.key === "Enter" && highlightedIndex >= 0) {
                event.preventDefault();
                if (query.data[highlightedIndex]) {
                  handleSelect(query.data[highlightedIndex]);
                }
              }
            }}
            type="text"
            placeholder="gameName#tagline"
            className={clsx("w-full", inputClass)}
            {...register("search")}
          />
        </div>
        {isOpen && name.length >= 1 && (
          <div className="absolute left-0 bottom-0 h-0 w-full">
            <div
              className={clsx(
                "mt-1 max-h-80 w-full overflow-y-auto rounded",
                "bg-linear-to-tr quiet-scroll from-slate-900/80",
                "via-slate-900/90 to-zinc-900/80 p-3 shadow-md",
              )}
            >
              {query.isSuccess &&
                query.data.map((x: SummonerType, i: number) => {
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlightedIndex}
                      onClick={() => handleSelect(x)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={clsx(
                        "flex h-fit w-full items-center rounded py-1 text-left hover:cursor-pointer",
                        i === highlightedIndex
                          ? "bg-white/10"
                          : "hover:bg-white/10",
                      )}
                      key={x.puuid}
                    >
                      <div className="h-full w-16">
                        <div className="mr-3 rounded border border-gray-300 px-0 py-1 text-center">
                          {x.summoner_level}
                        </div>
                      </div>
                      <div className="">
                        {x.riot_id_name}#{x.riot_id_tagline}
                      </div>
                    </button>
                  );
                })}
              {query.isSuccess && query.data.length === 0 && (
                <div>No results found.</div>
              )}
            </div>
          </div>
        )}
      </div>
      {showButton && (
        <button type="submit" className="btn btn-primary mt-2 w-full">
          Search
        </button>
      )}
    </form>
  );
}
