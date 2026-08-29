import { useCallback, useEffect } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import numeral from "numeral";
import clsx from "clsx";
import { getMyPart, mediaUrl } from "@/components/utils";
import { useBasicChampions } from "@/hooks";
import { useTimelineIndex } from "@/stores";

import type {
  SummonerType,
  SimpleMatchType,
  FrameType,
  EliteMonsterKillEventType,
  FullParticipantType,
} from "@/external/types";
import Image from "@/compat/image";

interface AugmentedEliteMonsterKillEventType extends EliteMonsterKillEventType {
  frame_timestamp: number;
}
interface AugmentedFrameType extends FrameType {
  team100_gold: number;
  team200_gold: number;
  team100_adv: number;
  team200_adv: number;
  team100_perc_adv: number;
  team200_perc_adv: number;
  frame_timestamp: number;
  elitemonsterkillevents: AugmentedEliteMonsterKillEventType[];
}

function Timeline(props: {
  summoner: SummonerType;
  match: SimpleMatchType;
  participants: FullParticipantType[];
  timeline: FrameType[];
}) {
  const [timelineIndex, setTimelineIndex] = useTimelineIndex(props.match._id);

  const [timeline, setTimeline] = useState<AugmentedFrameType[]>([]);
  const participants = props.participants;
  const match = props.match;
  const champions = useBasicChampions();

  const [mypart, setMypart] = useState<FullParticipantType>();
  const big_events = timelineIndex !== null ? getBigEvents(timelineIndex) : [];

  function getEvents(index: number | null) {
    if (index === null) {
      return [];
    }
    const frame = timeline[index];
    return frame
      ? [
          ...frame.buildingkillevents,
          ...frame.elitemonsterkillevents,
          ...frame.championkillevents,
          ...frame.turretplatedestroyedevents,
        ]
      : [];
  }

  function getBigEvents(index: number) {
    const events = getEvents(index);
    const include_events = new Set([
      "CHAMPION_KILL",
      "BUILDING_KILL",
      "ELITE_MONSTER_KILL",
      "TURRET_PLATE_DESTROYED",
    ]);
    const big_events = [];
    for (const event of events) {
      if (include_events.has(event._type)) {
        if (event.killer_id !== 0) {
          big_events.push(event);
        } else if (event._type === "TURRET_PLATE_DESTROYED") {
          big_events.push(event);
        }
      }
    }
    return big_events.sort((a, b) => a.timestamp - b.timestamp);
  }

  function getMyTeamDataKey(
    style?: 'perc' | 'gold'
  ): "team100_adv" | "team200_adv" | "team100_perc_adv" | "team200_perc_adv" {
    if (!mypart) {
      return "team100_adv";
    }
    const myteam = mypart.team_id as 100 | 200;
    if (style === "perc") {
      return `team${myteam}_perc_adv`;
    }
    return `team${myteam}_adv`;
  }

  function getOffset() {
    const dataMax = Math.max(...timeline.map((i) => i[getMyTeamDataKey()]));
    const dataMin = Math.min(...timeline.map((i) => i[getMyTeamDataKey()]));
    if (dataMax <= 0) {
      return 0;
    } else if (dataMin >= 0) {
      return 1;
    } else {
      return dataMax / (dataMax - dataMin);
    }
  }

  function getReferenceEvents() {
    const reference_lines = [];
    let events;
    let frame;
    for (let i = 0; i < timeline.length; i++) {
      frame = timeline[i] as FrameType;
      events = getBigEvents(i);
      for (const event of events) {
        if (event._type === "ELITE_MONSTER_KILL") {
          reference_lines.push({ ...event, frame_timestamp: frame.timestamp });
        }
      }
    }
    return reference_lines;
  }

  function getEventTeam(event: any) {
    let team_id = null;
    let part;
    if (event._type === "CHAMPION_KILL") {
      part = getPart(event.victim_id);
      if (part !== null && part.team_id === 100) {
        team_id = 200;
      } else {
        team_id = 100;
      }
    } else if (event._type === "BUILDING_KILL") {
      return event.team_id === 100 ? 200 : 100;
    } else if (event._type === "ELITE_MONSTER_KILL") {
      part = getPart(event.killer_id);
      if (part) {
        team_id = part.team_id;
      }
    } else if (event._type === "TURRET_PLATE_DESTROYED") {
      return event.team_id;
    }
    return team_id;
  }

  function getPart(participant_id: number) {
    for (const part of participants) {
      if (part._id === participant_id) {
        return part;
      }
    }
    return null;
  }

  const sortTimelineEvents = useCallback((timeline: any) => {
    if (!timeline?.events) {
      return timeline;
    }
    return timeline.map((frame: any) => ({
      ...frame,
      events: frame.events ? [...frame.events].sort((a: any, b: any) => a.timestamp - b.timestamp) : frame.events,
    }));
  }, []);

  function combineTimelineCS(timeline: any) {
    return timeline.map((frame: any) => ({
      ...frame,
      participantframes: frame.participantframes.map((pframe: any) => ({
        ...pframe,
        cs: pframe.jungle_minions_killed + pframe.minions_killed,
      })),
    }));
  }

  const addTeamGoldToTimeline = useCallback(
    (timeline: any, participants: FullParticipantType[]) => {
      const team100 = [];
      const team200 = [];
      for (const part of participants) {
        if (part.team_id === 100) {
          team100.push(part._id);
        } else {
          team200.push(part._id);
        }
      }
      let team100_total;
      let team200_total;
      const newTimeline = [];
      for (let i = 0; i < timeline.length; i++) {
        const frame = timeline[i];
        team100_total = 0;
        team200_total = 0;
        for (const pframe of frame.participantframes) {
          if (pframe.total_gold !== undefined) {
            if (team100.indexOf(pframe.participant_id) >= 0) {
              team100_total += pframe.total_gold;
            } else {
              team200_total += pframe.total_gold;
            }
          }
        }

        const team100_adv = team100_total - team200_total;
        const team200_adv = team200_total - team100_total;

        let team100_perc_adv;
        let team200_perc_adv;
        if (team100_adv >= 0) {
          team100_perc_adv = (team100_adv / team200_total) * 100;
          team200_perc_adv = -team100_perc_adv;
        } else {
          team200_perc_adv = (team200_adv / team100_total) * 100;
          team100_perc_adv = -team200_perc_adv;
        }

        newTimeline.push({
          ...frame,
          team100_gold: team100_total,
          team200_gold: team200_total,
          team100_adv,
          team200_adv,
          team100_perc_adv,
          team200_perc_adv,
        });
      }
      return newTimeline;
    },
    []
  );

  useEffect(() => {
    let new_timeline = addTeamGoldToTimeline(props.timeline, participants);
    new_timeline = sortTimelineEvents(new_timeline);
    new_timeline = combineTimelineCS(new_timeline);
    setTimeline(new_timeline);
  }, [props.timeline, addTeamGoldToTimeline, participants, sortTimelineEvents]);

  useEffect(() => {
    if (props.summoner !== undefined) {
      setMypart(getMyPart(participants, props.summoner.puuid));
    }
  }, [props.summoner, participants]);

  const getMonsterLabel = (event: EliteMonsterKillEventType) => {
    if (event.monster_type === "DRAGON") {
      if (event.monster_sub_type === "EARTH_DRAGON") {
        return <span>earth</span>;
      } else if (event.monster_sub_type === "WATER_DRAGON") {
        return <span>water</span>;
      } else if (event.monster_sub_type === "FIRE_DRAGON") {
        return <span>fire</span>;
      } else if (event.monster_sub_type === "AIR_DRAGON") {
        return <span>cloud</span>;
      } else if (event.monster_sub_type === "ELDER_DRAGON") {
        return <span>elder</span>;
      } else {
        return <span>{event.monster_sub_type}</span>;
      }
    } else if (event.monster_type === "BARON_NASHOR") {
      return <span>purple snek</span>;
    } else if (event.monster_type === "RIFTHERALD") {
      return <span>big scuttle</span>;
    } else {
      return (
        <span>
          {event.monster_type} {event.monster_sub_type}
        </span>
      );
    }
  };

  const div_width = 600;
  const chartData = timeline.map(frame => {
    const mutableFrame = { ...frame };
    mutableFrame.team100_gold = frame.team100_gold || 0;
    mutableFrame.team200_gold = frame.team200_gold || 0;
    mutableFrame.team100_adv = frame.team100_adv || 0;
    mutableFrame.team200_adv = frame.team200_adv || 0;
    mutableFrame.team100_perc_adv = frame.team100_perc_adv || 0;
    mutableFrame.team200_perc_adv = frame.team200_perc_adv || 0;
    return mutableFrame;
  });

  return (
    <div>
      <div className="align-center">
        <ComposedChart
          width={div_width}
          height={300}
          data={chartData}
          margin={{
            top: 10,
            right: 15,
            left: -5,
            bottom: 0,
          }}
          onMouseMove={(props) => {
            if (props.activeTooltipIndex !== undefined) {
              const new_timeline_index = props.activeTooltipIndex?.toString();
              if (new_timeline_index !== undefined) {
                setTimelineIndex(parseInt(new_timeline_index));
              }
            }
          }}
        >
          <CartesianGrid vertical={false} stroke="#777" strokeDasharray="4 4" />
          <XAxis
            hide={true}
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
              return numeral(tick).format("0.0a");
            }}
          />

          <Tooltip
            offset={70}
            formatter={(value: any, name: any) => {
              if (name.indexOf("perc") >= 0) {
                value = numeral(value).format("0");
                return [`${value}%`, "% Gold Adv."];
              } else {
                value = numeral(value).format("0,0");
                return [`${value}g`, "Gold Adv."];
              }
            }}
            labelFormatter={(label) => {
              let m = "?";
              if (typeof label == "number") {
                m = Math.round(label / 1000 / 60).toString();
              }
              return `${m}m`;
            }}
          />
          <defs>
            <linearGradient
              id={`${match._id}-gradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset={getOffset()} stopColor="#3674ad" stopOpacity={1} />
              <stop offset={getOffset()} stopColor="#cd565a" stopOpacity={1} />
            </linearGradient>
          </defs>

          <Area
            yAxisId="left"
            type="monotone"
            dataKey={getMyTeamDataKey()}
            stroke="#000"
            fill={`url(#${match._id}-gradient)`}
          />

          {getReferenceEvents().map((event) => {
            let color = "#3674ad";
            if (getEventTeam(event) !== mypart?.team_id) {
              color = "#cd565a";
            }
            let stroke_width = 1;
            if (event.monster_type === "BARON_NASHOR") {
              stroke_width = 3;
            } else if (event.monster_sub_type === "ELDER_DRAGON") {
              stroke_width = 3;
            }
            return (
              <ReferenceLine
                yAxisId="left"
                key={`${match._id}-${event.timestamp}`}
                x={event.frame_timestamp}
                stroke={color}
                strokeWidth={stroke_width}
              />
            );
          })}

          {timelineIndex && timeline[timelineIndex]?.timestamp && (
            <ReferenceLine
              yAxisId="left"
              x={timeline[timelineIndex]?.timestamp}
              stroke="white"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </div>

      <div
        className="quiet-scroll mt-2 h-[240px] overflow-y-auto rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2"
        style={{ width: div_width }}
      >
        {big_events.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Hover over graph to see events.
          </div>
        )}
        {big_events.map((event, key) => {
          const isRight = getEventTeam(event) === 100;
          return (
            <div
              key={`${match._id}-event-${key}`}
              className="flex"
            >
              <div className="w-1/2 pr-1">
                {!isRight && (
                  <EventRow
                    event={event}
                    mypart={mypart}
                    getPart={getPart}
                    getMonsterLabel={getMonsterLabel}
                    champions={champions}
                  />
                )}
              </div>
              <div className="w-px shrink-0 bg-zinc-700/50" />
              <div className="w-1/2 pl-1">
                {isRight && (
                  <EventRow
                    event={event}
                    mypart={mypart}
                    getPart={getPart}
                    getMonsterLabel={getMonsterLabel}
                    champions={champions}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({
  event,
  mypart,
  getPart,
  getMonsterLabel,
  champions,
}: {
  event: any;
  mypart?: FullParticipantType;
  getPart: (id: number) => FullParticipantType | null;
  getMonsterLabel: (event: EliteMonsterKillEventType) => React.ReactNode;
  champions: any;
}) {
  const part1 = getPart(event.killer_id);
  const part2 =
    event._type === "CHAMPION_KILL" ? getPart(event?.victim_id) : undefined;

  const isMe =
    (part1 && part1._id === mypart?._id) ||
    (part2 && part2._id === mypart?._id);

  const minutes = Math.floor(event.timestamp / 1000 / 60);
  const seconds = numeral((event.timestamp / 1000) % 60).format("00");

  const champIcon = (part: FullParticipantType | null) => {
    if (!part) return <span className="text-zinc-500">minions</span>;
    const img = champions[part.champion_id]?.image?.file_40;
    if (!img) return null;
    return (
      <Image
        height={18}
        width={18}
        className="rounded"
        src={mediaUrl(img)}
        alt={champions[part.champion_id]?.name || ""}
        title={part.riot_id_name}
      />
    );
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs",
        isMe ? "bg-indigo-950/50" : ""
      )}
    >
      <span className="w-9 shrink-0 tabular-nums text-zinc-500">
        {minutes}:{seconds}
      </span>

      {event._type === "CHAMPION_KILL" && (
        <div className="flex items-center gap-1">
          {champIcon(part1)}
          <span className="text-zinc-500">killed</span>
          {champIcon(part2 ?? null)}
        </div>
      )}

      {event._type === "BUILDING_KILL" && (
        <div className="flex items-center gap-1">
          {champIcon(part1)}
          <span className="text-zinc-500">destroyed</span>
          <span>
            {event.building_type === "TOWER_BUILDING" && "tower"}
            {event.building_type === "INHIBITOR_BUILDING" && "inhib"}
          </span>
        </div>
      )}

      {event._type === "TURRET_PLATE_DESTROYED" && (
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">plate destroyed</span>
        </div>
      )}

      {event._type === "ELITE_MONSTER_KILL" && (
        <div className="flex items-center gap-1">
          {champIcon(part1)}
          <span className="text-zinc-500">killed</span>
          {getMonsterLabel(event)}
        </div>
      )}
    </div>
  );
}

export { Timeline };
