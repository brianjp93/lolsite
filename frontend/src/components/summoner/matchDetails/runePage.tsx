import { useState, useEffect, useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
import { Popover } from "react-tiny-popover";
import numeral from "numeral";
import { StatModTable } from "./statMod";
import { useRunes, useBasicChampions } from "@/hooks";
import type { FullParticipantType, RuneType } from "@/external/types";

import { RUNEDATA as RUNES } from "@/utils/constants";
import Image from "@/compat/image";
import { mediaUrl } from "@/components/utils";
import clsx from "clsx";

export function RunePage({
  mypart,
  participants,
  match,
  matchCardHeight,
}: {
  mypart: FullParticipantType;
  participants: FullParticipantType[];
  match: { major: number; minor: number; id: number; _id: string };
  matchCardHeight: number;
}) {
  const [selectedPart, setSelectedPart] = useState<
    FullParticipantType | undefined
  >();
  const version = `${match.major}.${match.minor}`;
  const runes = useRunes(version);
  const champions = useBasicChampions();

  const getPerks = (part: FullParticipantType) => {
    const perks: { id: number; var1: number; var2: number; var3: number }[] =
      [];
    if (!part && selectedPart) {
      part = selectedPart;
    } else if (part === null) {
      return [];
    }
    for (let i = 0; i <= 5; i++) {
      const perk = {
        id: part.stats[`perk_${i}` as keyof typeof part.stats] as number,
        var1: part.stats[`perk_${i}_var_1` as keyof typeof part.stats] as number,
        var2: part.stats[`perk_${i}_var_2` as keyof typeof part.stats] as number,
        var3: part.stats[`perk_${i}_var_3` as keyof typeof part.stats] as number,
      };
      if (perk.id !== 0) {
        perks.push(perk);
      }
    }
    return perks;
  };

  const partSelection = () => {
    return participants.map((part) => {
      const champ = champions[part.champion_id];
      const is_selected = selectedPart && part._id === selectedPart._id;
      return (
        <div key={`${match.id}-${part.id}-rune-champ-image`}>
          {champ?.image?.file_40 === "" && (
            <div
              title={part.riot_id_name}
              onClick={() => setSelectedPart(part)}
              role='button'
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedPart(part);
                }
              }}
              className={clsx("my-0.5 h-7.5 w-7.5 cursor-pointer rounded-md transition-all", {
                "ring-2 ring-sky-400 brightness-110": is_selected,
                "opacity-50 hover:opacity-80": !is_selected,
              })}
            >
              NA
            </div>
          )}
          {champ?.image?.file_40 && (
            <Image
              title={part.riot_id_name}
              onClick={() => setSelectedPart(part)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedPart(part);
                }
              }}
              tabIndex={1}
              role='button'
              height={30}
              width={30}
              className={clsx("my-0.5 rounded-md cursor-pointer transition-all", {
                "ring-2 ring-sky-400 brightness-110": is_selected,
                "opacity-50 hover:opacity-80": !is_selected,
              })}
              src={mediaUrl(champ?.image?.file_40)}
              alt="Champion"
            />
          )}
        </div>
      );
    });
  };

  useEffect(() => {
    if (!participants) {
      return;
    }
    for (const part of participants) {
      if (part._id === mypart._id) {
        setSelectedPart(part);
      }
    }
  }, [mypart, participants]);

  const rune_stat_height = (matchCardHeight - 20) / 6;
  return (
    <div className="flex">
      <div className="mr-5 ml-9 flex flex-col justify-around">
        {partSelection()}
      </div>
      {selectedPart !== undefined && (
        <div className="flex flex-col gap-1 w-92.5">
          {getPerks(selectedPart).map((perk) => {
            const rune = runes[perk.id as unknown as keyof typeof runes];
            const rune_etc = RUNES.data[perk.id.toString() as keyof typeof RUNES.data];
            if (rune && rune_etc && rune_etc.perkFormat) {
              return (
                <div
                  key={`${match.id}-${perk.id}`}
                  style={{ height: rune_stat_height }}
                >
                  <div style={{ display: "inline-block" }}>
                    <RuneTooltip
                      rune={rune}
                      style={{ display: "inline-block" }}
                    >
                      <Image
                        height={40}
                        width={40}
                        className="mr-4"
                        src={rune.image_url}
                        alt={rune.name}
                      />
                    </RuneTooltip>

                    <div
                      style={{
                        display: "inline-block",
                        verticalAlign: "top",
                      }}
                    >
                      {rune_etc.perkFormat.map((perk_format, j) => {
                        const desc = rune_etc.perkDesc[j];
                        return (
                          <div
                            style={{ lineHeight: 1 }}
                            key={`${match._id}-${j}`}
                          >
                            <div
                              style={{
                                display: "inline-block",
                                width: 200,
                              }}
                            >
                              {desc}
                            </div>
                            <div
                              style={{
                                display: "inline-block",
                                fontWeight: "bold",
                              }}
                            >
                              {perk_format
                                .replace(
                                  "{0}",
                                  perk[`var${j + 1}` as keyof typeof perk].toString()
                                )
                                .replace(
                                  "{1}",
                                  numeral(
                                    perk[`var${j + 2}` as keyof typeof perk]
                                  ).format("00")
                                )
                                .replace(
                                  "{2}",
                                  perk[`var${j + 2}` as keyof typeof perk]?.toString() || ""
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            } else {
              if (rune) {
                return (
                  <div key={`${match.id}-${perk.id}`}>
                    <div>{rune._id}</div>
                  </div>
                );
              } else {
                return <div key={`${match.id}-${perk.id}`}>{perk.id}</div>;
              }
            }
          })}

          {getPerks(selectedPart).length === 0 && (
            <div style={{ textAlign: "center", textDecoration: "underline" }}>
              No runes set
            </div>
          )}
        </div>
      )}
      {selectedPart && (
        <div
          style={{ display: "inline-block", margin: 20, verticalAlign: "top" }}
        >
          <StatModTable participant={selectedPart} />
        </div>
      )}
    </div>
  );
}

export function RuneTooltip({
  rune,
  style,
  children,
}: {
  rune: RuneType;
  style: CSSProperties;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((x) => !x);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Popover
      isOpen={isOpen}
      positions={["top"]}
      containerStyle={{ zIndex: "11" }}
      content={
        <div>
          <h5 style={{ textDecoration: "underline", marginTop: -5 }}>
            {rune.name}
          </h5>

          <div
            dangerouslySetInnerHTML={{ __html: rune.long_description }}
          ></div>
        </div>
      }
    >
      <div
        ref={ref}
        style={style}
        onClick={toggle}
        role='button'
        tabIndex={1}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onMouseOver={() => setIsOpen(true)}
        onMouseOut={() => setIsOpen(false)}
      >
        {children}
      </div>
    </Popover>
  );
}
