import { useState, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useBasicChampions } from "@/hooks";
import numeral from "numeral";
import type {
  SummonerType,
  FrameType,
  ParticipantFrameType,
  FullParticipantType,
} from "@/external/types";
import { useTimelineIndex } from "@/stores";
import { getMyPart, mediaUrl } from "@/components/utils";
import Image from "@/compat/image";
import clsx from "clsx";

type GraphType =
  | "total_gold"
  | "cs"
  | "xp"
  | "level"
  | "total_damage_done_to_champions"
  | "time_enemy_spent_controlled"
  | "gold_per_second"
  | "current_gold"
  | 'ability_haste'
  | 'ability_power'
  | 'armor'
  | 'armor_pen'
  | 'armor_pen_percent'
  | 'attack_damage'
  | 'attack_speed'
  | 'bonus_armor_pen_percent'
  | 'bonus_magic_pen_percent'
  | 'cc_reduction'
  | 'health'
  | 'health_max'
  | 'health_regen'
  | 'lifesteal'
  | 'magic_pen'
  | 'magic_pen_percent'
  | 'magic_resist'
  | 'movement_speed'
  | 'omnivamp'
  | 'physical_vamp'
  | 'power'
  | 'power_max'
  | 'power_regen'
  | 'spell_vamp'
  | 'magic_damage_done'
  | 'magic_damage_done_to_champions'
  | 'magic_damage_taken'
  | 'physical_damage_done'
  | 'physical_damage_done_to_champions'
  | 'physical_damage_taken'
  | 'total_damage_done'
  | 'total_damage_done_to_champions'
  | 'total_damage_taken'
  | 'true_damage_done'
  | 'true_damage_done_to_champions'
  | 'true_damage_taken'
interface AugmentedParticipantFrame extends ParticipantFrameType {
  cs: number;
}
interface AugmentedFrameType extends FrameType {
  participantframes: AugmentedParticipantFrame[];
}

export function ChampionTimelinesInner({
  matchId,
  summoner,
  participants,
  timeline,
}: {
  matchId: string;
  summoner: SummonerType;
  participants: FullParticipantType[];
  timeline: FrameType[];
}) {
  const my_part = getMyPart(participants, summoner.puuid);
  const [participant_selection, setParticipantSelection] = useState(
    participants.map((item) => item._id)
  );
  const [graph_type, setGraphType] = useState<GraphType>("total_gold");
  const champions = useBasicChampions();
  const [timelineIndex, setTimelineIndex] = useTimelineIndex(matchId);

  participants = useMemo(() => {
    return [
      ...participants.filter((participant) => participant.team_id === 100),
      ...participants.filter((participant) => participant.team_id === 200),
    ];
  }, [participants]);
  const participant_ids = participants.map(
    (participant: FullParticipantType) => participant._id
  );
  const colors = [
    "#d94630",
    "#d98d30",
    "#d9d330",
    "#90d930",
    "#3ca668",
    "#3ca69a",
    "#3c71a6",
    "#545acc",
    "#8c4fd6",
    "#eb80d6",
    "#d74da0",
    "#994352",
  ];

  const statButton = (title: string, value: GraphType, tooltip?: string) => {
    const isActive = graph_type === value;
    return (
      <button
        key={value}
        title={tooltip}
        onClick={() => setGraphType(value)}
        className={clsx(
          "cursor-pointer rounded border px-1.5 py-0.5 text-left text-[11px] transition-colors",
          isActive
            ? "border-sky-500/50 bg-sky-900/40 font-medium text-sky-200"
            : "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-200"
        )}
      >
        {title}
      </button>
    );
  };

  const sectionHeader = (title: string) => (
    <div className="mt-2 mb-1 border-b border-zinc-700/50 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 first:mt-0">
      {title}
    </div>
  );

  const clearAll = useCallback(() => setParticipantSelection([]), []);
  const selectAll = useCallback(() => {
    const parts = participants.map((part) => part._id);
    setParticipantSelection(parts);
  }, [participants]);

  return (
    <div className="flex items-start gap-1">
      <div className="quiet-scroll flex h-[440px] w-[120px] shrink-0 flex-col overflow-y-auto pr-1">
        {sectionHeader("Gold & Economy")}
        {statButton("Total Gold", "total_gold")}
        {statButton("Current Gold", "current_gold")}
        {statButton("Gold/Sec", "gold_per_second", "Passive gold generation from support items?")}
        {statButton("CS", "cs")}
        {statButton("XP", "xp")}
        {statButton("Level", "level")}

        {sectionHeader("Damage Dealt")}
        {statButton("Champ DMG", "total_damage_done_to_champions")}
        {statButton("Physical", "physical_damage_done_to_champions")}
        {statButton("Magic", "magic_damage_done_to_champions")}
        {statButton("True", "true_damage_done_to_champions")}

        {sectionHeader("Damage Taken")}
        {statButton("Total", "total_damage_taken")}
        {statButton("Physical", "physical_damage_taken")}
        {statButton("Magic", "magic_damage_taken")}
        {statButton("True", "true_damage_taken")}

        {sectionHeader("Defense")}
        {statButton("Armor", "armor")}
        {statButton("Magic Resist", "magic_resist")}

        {sectionHeader("Offense")}
        {statButton("Attack Damage", "attack_damage")}
        {statButton("Attack Speed", "attack_speed")}
        {statButton("Ability Power", "ability_power")}
        {statButton("Armor Pen", "armor_pen")}
        {statButton("Armor Pen %", "armor_pen_percent")}
        {statButton("Magic Pen", "magic_pen")}
        {statButton("Magic Pen %", "magic_pen_percent")}

        {sectionHeader("Health & Sustain")}
        {statButton("Health", "health")}
        {statButton("Max Health", "health_max")}
        {statButton("Lifesteal", "lifesteal")}

        {sectionHeader("Utility")}
        {statButton("CC Time", "time_enemy_spent_controlled", "Time enemy spent controlled")}

        <div className="pb-16" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap justify-center">
          {participants.map((participant, index) => {
            return (
              <ChampionImage
                key={`${participant._id}-champion-image`}
                is_me={participant._id === my_part?._id}
                color={colors[index]}
                is_selected={participant_selection.indexOf(participant._id) >= 0}
                participant={participant}
                handleClick={() => {
                  let new_selection = [...participant_selection];
                  if (participant_selection.indexOf(participant._id) >= 0) {
                    new_selection = new_selection.filter(
                      (id) => id !== participant._id
                    );
                  } else {
                    new_selection.push(participant._id);
                  }
                  setParticipantSelection(new_selection);
                }}
              />
            );
          })}
        </div>

        <div className="my-1 flex gap-1 px-1">
          <button
            onClick={clearAll}
            className={clsx(
              "flex-1 cursor-pointer rounded border px-1.5 py-0.5 text-[11px] transition-colors",
              "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-200"
            )}
          >
            Clear All
          </button>
          <button
            onClick={selectAll}
            className={clsx(
              "flex-1 cursor-pointer rounded border px-1.5 py-0.5 text-[11px] transition-colors",
              "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/50 hover:text-zinc-200"
            )}
          >
            Select All
          </button>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            onMouseMove={(props) => {
              if (props.activeTooltipIndex !== undefined) {
                const new_timeline_index = props.activeTooltipIndex?.toString();
                if (new_timeline_index !== undefined) {
                  setTimelineIndex(parseInt(new_timeline_index));
                }
              }
            }}
            margin={{
              left: -10,
              right: 20,
            }}
            data={timeline}
          >
            <CartesianGrid
              vertical={false}
              stroke="#777"
              strokeDasharray="4 4"
            />

            <XAxis
              hide={false}
              tickFormatter={(tickItem) => {
                const m = Math.round(tickItem / 1000 / 60);
                return `${m}m`;
              }}
              dataKey="timestamp"
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(tick) => {
                return numeral(tick).format("0a");
              }}
            />

            {timelineIndex && (
              <ReferenceLine
                yAxisId="left"
                x={timeline[timelineIndex]?.timestamp}
                stroke="white"
                strokeWidth={2}
              />
            )}

            {participant_selection.map((id) => {
              const stroke = colors[participant_ids.indexOf(id)];
              const stroke_width = id !== my_part?._id ? 1 : 3;
              const stroke_type =
                graph_type === "level" ? "stepAfter" : "monotone";
              const part = getParticipant(participants, id);
              if (!part) {
                return null;
              }
              return (
                <Line
                  name={champions[part.champion_id]?.name}
                  key={`${id}-line-chart`}
                  isAnimationActive={false}
                  yAxisId="left"
                  type={stroke_type}
                  dot={false}
                  dataKey={(frame: AugmentedFrameType) => {
                    for (const part of frame.participantframes) {
                      if (part.participant_id === id) {
                        return part[graph_type];
                      }
                    }
                    return null;
                  }}
                  stroke={stroke}
                  strokeWidth={stroke_width}
                />
              );
            })}
            <Tooltip
              itemSorter={(item: any) => -item.value}
              wrapperStyle={{ zIndex: 10 }}
              formatter={(value: any) => {
                let output;
                if (graph_type === "total_gold") {
                  output = `${numeral(value).format("0,0")} gold`;
                } else {
                  output = value;
                }
                return output;
              }}
              labelFormatter={(label) => {
                let m = "";
                if (typeof label === "number") {
                  m = Math.round(label / 1000 / 60).toString();
                }
                return `${m}m`;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getParticipant(participants: FullParticipantType[], id: number) {
  for (const part of participants) {
    if (part._id === id) {
      return part;
    }
  }
  return null;
}

function ChampionImage(props: any) {
  const champions = useBasicChampions();
  let image_style: any = {
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: props.color,
    cursor: "pointer",
    width: 30,
    height: 30,
  };
  if (!props.is_selected) {
    image_style = {
      ...image_style,
      opacity: 0.3,
    };
  }

  return (
    <div style={{ padding: "0px 4px" }}>
      {mediaUrl(champions[props.participant.champion_id]?.image.file_30) ===
        "" && (
        <div onClick={props.handleClick} style={{ ...image_style }}>
          NA
        </div>
      )}
      {champions?.[props.participant?.champion_id]?.image?.file_30 && (
        <Image
          role="button"
          tabIndex={1}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              props.handleClick();
            }
          }}
          onClick={props.handleClick}
          height={30}
          width={30}
          style={{ ...image_style }}
          src={mediaUrl(
            champions?.[props.participant.champion_id]?.image?.file_30
          )}
          alt={
            champions?.[props.participant.champion_id]?.name || "Champion Image"
          }
        />
      )}
    </div>
  );
}
