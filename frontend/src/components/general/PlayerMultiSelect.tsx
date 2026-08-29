import { useEffect, useRef, useState } from "react";
import { useSummonerSearch } from "@/hooks";
import clsx from "clsx";
import type { SummonerType } from "@/external/types";

export function PlayerMultiSelect({
  region,
  value,
  onChange,
}: {
  region: string;
  value: string[];
  onChange: (names: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = useSummonerSearch({ name: inputValue, region });

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (event.target instanceof Element) {
        if (!ref.current?.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const addName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setHighlightedIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeName = (name: string) => {
    onChange(value.filter((n) => n !== name));
  };

  const handleSelect = (summoner: SummonerType) => {
    addName(`${summoner.riot_id_name}#${summoner.riot_id_tagline}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && inputValue === "" && value.length > 0) {
      const name = value[value.length - 1];
      if (name) {
        removeName(name);
      }
      return;
    }

    if (event.key === " " && inputValue.trim()) {
      event.preventDefault();
      addName(inputValue);
      return;
    }

    if (!isOpen || !query.data?.length) return;
    const count = query.data.length;

    if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
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
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="flex min-h-9 flex-wrap items-center gap-1 border-b border-slate-400 bg-transparent px-1 pt-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-sm"
          >
            {name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeName(name);
              }}
              className="ml-0.5 hover:cursor-pointer hover:text-red-400"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setHighlightedIndex(-1);
            if (e.target.value.length > 0) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (inputValue.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Search summoners..." : ""}
          className="min-w-24 flex-1 border-none bg-transparent py-0.5 outline-none"
        />
      </div>
      {isOpen && inputValue.length > 0 && (
        <div className="absolute left-0 top-full z-10 w-full">
          <div
            className={clsx(
              "mt-1 max-h-60 w-full overflow-y-auto rounded",
              "bg-linear-to-tr quiet-scroll from-slate-900/80",
              "via-slate-900/90 to-zinc-900/80 p-3 shadow-md"
            )}
          >
            {query.isSuccess &&
              query.data.map((x, i) => (
                <div
                  role="option"
                  aria-selected={i === highlightedIndex}
                  onClick={() => handleSelect(x)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={clsx(
                    "flex h-fit w-full items-center rounded py-1 hover:cursor-pointer",
                    i === highlightedIndex ? "bg-white/10" : "hover:bg-white/10"
                  )}
                  key={x.puuid}
                >
                  <div className="h-full w-16">
                    <div className="mr-3 rounded border border-gray-300 px-0 py-1 text-center">
                      {x.summoner_level}
                    </div>
                  </div>
                  <div>
                    {x.riot_id_name}#{x.riot_id_tagline}
                  </div>
                </div>
              ))}
            {query.isSuccess && query.data.length === 0 && (
              <div>No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
