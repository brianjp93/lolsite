import React, {useState, useEffect, useCallback} from 'react'
import ReactDOMServer from 'react-dom/server'
import {buildings_default} from '../../constants/buildings'
import ReactTooltip from 'react-tooltip'
import {useChampions} from '../../hooks'
import {useTimelineIndex} from '../../stores'

import type {
  FullMatchType,
  FrameType,
  FullParticipantType,
  BuildingKillEventType,
  ChampionKillEventType,
  EliteMonsterKillEventType,
  TurretPlateDestroyedEventType,
  VictimDamageType,
} from '../../types'

const SWORD = 'https://www.svgrepo.com/show/105378/sword.svg'

function mapAssistName(name: string) {
  if (name.match(/sru.*minion/i)) {
    return 'Minions'
  } else if (name.match(/sru.*turret/i)) {
    return 'Tower'
  } else if (name.match(/sru.*red/i)) {
    return 'Red Buff'
  } else if (name.match(/sru.*krug/i)) {
    return 'Krugs'
  } else if (name.match(/sru.*dragon/i)) {
    return 'Dragon'
  } else if (name.match(/sru.*razorbeak/i)) {
    return 'Birds'
  } else if (name.match(/sru.*blue/i)) {
    return 'Blue Buff'
  } else if (name.match(/sru.*wolf/i)) {
    return 'Wolves'
  } else if (name.match(/sru.*gromp/i)) {
    return 'Gromp'
  } else if (name.match(/sru.*rift.*herald/i)) {
    return 'Rift Herald'
  } else if (name.match(/sru.*baron/i)) {
    return 'Baron'
  }
  return name
}

export function MapEvents(props: {
  summoner: any
  match: FullMatchType
  participants: FullParticipantType[]
  timeline: FrameType[]
  store: any
  route: any
}) {
  const [index, setIndex] = useState(0)
  const [buildings, setBuildings] = useState<any>({})
  const [part_dict, setPartDict] = useState<Record<number, FullParticipantType>>({})
  const [players, setPlayers] = useState<any>([])
  const champions = useChampions()
  const [outerTimelineIndex, setOuterTimelineIndex] = useTimelineIndex(props.match._id)

  const match = props.match
  const store = props.store
  const theme = store.state.theme
  const timeline = props.timeline
  const participants = props.participants

  const image_size = 500
  const max_x = 15300
  const max_y = 15000
  const slice = timeline[index]

  ReactTooltip.rebuild()

  function getPosition(x: number, y: number): [number, number] {
    let x_val = (x / max_x) * image_size
    let y_val = (y / max_y) * image_size
    return [x_val, y_val]
  }

  const displayEvents = useCallback(() => {
    return [
      ...slice.buildingkillevents.map((ev) => {
        const pos = getPosition(ev.x, ev.y)
        return (
          <EventBubble
            key={`building-${ev.timestamp}-${ev.x}`}
            part_dict={part_dict}
            buildingKillEvent={ev}
            pos={pos}
          />
        )
      }),
      ...slice.championkillevents.map((ev) => {
        const pos = getPosition(ev.x, ev.y)
        return (
          <EventBubble
            key={`kill-${ev.timestamp}-${ev.x}`}
            part_dict={part_dict}
            championKillEvent={ev}
            pos={pos}
          />
        )
      }),
      ...slice.turretplatedestroyedevents.map((ev, key) => {
        // for whatever reason, I can have multiple identical events?
        const pos = getPosition(ev.x, ev.y)
        return (
          <EventBubble
            key={`plating-${ev.timestamp}-${pos}-${key}`}
            part_dict={part_dict}
            turretPlateDestroyedEvent={ev}
            pos={pos}
          />
        )
      }),
      ...slice.elitemonsterkillevents.map((ev) => {
        const pos = getPosition(ev.x, ev.y)
        return (
          <EventBubble
            key={`monster-${ev.timestamp}-${ev.x}-${ev.y}`}
            part_dict={part_dict}
            eliteMonsterKillEvent={ev}
            pos={pos}
          />
        )
      }),
    ]
  }, [slice, part_dict])

  const stepForward = useCallback(() => {
    let newindex = index + 1
    if (newindex < timeline.length) {
      setIndex(newindex)
      let new_buildings = {...buildings}
      for (let ev of slice.buildingkillevents) {
        let team = 'BLUE'
        if (ev.team_id === 200) {
          team = 'RED'
        }
        let key = `${team}-${ev.building_type}-${ev.lane_type}-${ev.tower_type}`
        if (new_buildings[key] !== undefined) {
          new_buildings[key].is_alive = false
        }
      }
      setBuildings(new_buildings)
    }
  }, [index, timeline, buildings, setOuterTimelineIndex, slice.buildingkillevents])

  const stepBackward = useCallback(() => {
    let newindex = index - 1
    if (newindex >= 0) {
      setIndex(newindex)
      let new_buildings = {...buildings}
      for (let ev of slice.buildingkillevents) {
        let team = 'BLUE'
        if (ev.team_id === 200) {
          team = 'RED'
        }
        let key = `${team}-${ev.building_type}-${ev.lane_type}-${ev.tower_type}`
        if (new_buildings[key] !== undefined) {
          new_buildings[key].is_alive = true
        }
      }
      setBuildings(new_buildings)
    }
  }, [index, buildings, setOuterTimelineIndex, slice.buildingkillevents])

  const getPlayers = useCallback(
    function () {
      let new_players = []
      for (let pframe of slice.participantframes) {
        let part = part_dict[pframe.participant_id]
        new_players.push({pframe, part})
      }
      setPlayers(new_players)
    },
    [slice, part_dict],
  )

  useEffect(() => {
    if (participants.length > 0) {
      let data: Record<number, FullParticipantType> = {}
      for (let part of participants) {
        data[part._id] = part
      }
      setPartDict(data)
    }
  }, [participants])

  useEffect(() => {
    if (Object.keys(part_dict).length > 0) {
      getPlayers()
    }
  }, [part_dict, getPlayers])

  useEffect(() => {
    let new_buildings = {...buildings_default} as any
    for (let key in new_buildings) {
      new_buildings[key].is_alive = true
    }
    setBuildings(new_buildings)
  }, [])

  useEffect(() => {
    if (index < outerTimelineIndex) {
      stepForward()
    } else if (index > outerTimelineIndex) {
      stepBackward()
    }
  }, [stepForward, stepBackward, outerTimelineIndex, index])

  return (
    <div style={{display: 'inline-block'}}>
      <div style={{position: 'relative'}}>
        <img
          style={{
            height: image_size,
            borderRadius: 10,
          }}
          src={`${store.state.static}general/map.jpg`}
          alt="League Map"
        />

        {Object.keys(buildings).map((key) => {
          let data = buildings[key]
          return (
            <Building
              key={`${match.id}-${key}`}
              pos={getPosition(data.x, data.y)}
              is_alive={data.is_alive}
            />
          )
        })}

        {players.length > 0 &&
          players.map((player: any) => {
            const [x, y] = getPosition(player.pframe.x, player.pframe.y)
            let border_color = 'red'
            if (player.part.team_id === 100) {
              border_color = 'blue'
            }
            return (
              <div
                key={player.part._id}
                style={{
                  transitionDuration: '.3s',
                  position: 'absolute',
                  left: x,
                  bottom: y,
                }}
              >
                <img
                  style={{
                    width: 25,
                    borderRadius: '50%',
                    border: `2px solid ${border_color}`,
                  }}
                  src={champions[player.part.champion_id]?.image?.file_30}
                  alt="participant bubble"
                />
              </div>
            )
          })}

        {displayEvents()}
      </div>

      <div>
        <button
          onClick={() => {
            if (index > 0) {
              setOuterTimelineIndex((index) => index - 1)
            }
          }}
          className={`${theme} btn-small`}
        >
          <i className="material-icons">chevron_left</i>
        </button>
        <button
          style={{marginLeft: 8}}
          onClick={() => {
            if (index < timeline.length - 1) {
              setOuterTimelineIndex((index) => index + 1)
            }
          }}
          className={`${theme} btn-small`}
        >
          <i className="material-icons">chevron_right</i>
        </button>
        <div style={{marginLeft: 8, display: 'inline-block'}}>{index} min</div>
      </div>
    </div>
  )
}

function EventBubble({
  buildingKillEvent,
  championKillEvent,
  turretPlateDestroyedEvent,
  eliteMonsterKillEvent,
  pos,
  part_dict,
}: {
  buildingKillEvent?: BuildingKillEventType
  championKillEvent?: ChampionKillEventType
  turretPlateDestroyedEvent?: TurretPlateDestroyedEventType
  eliteMonsterKillEvent?: EliteMonsterKillEventType
  pos: [number, number]
  part_dict: Record<number, FullParticipantType>
}) {
  const champions = useChampions()
  const ev =
    buildingKillEvent || championKillEvent || turretPlateDestroyedEvent || eliteMonsterKillEvent
  if (!ev) {
    return null
  }
  if (Object.keys(part_dict).length === 0) {
    return null
  }
  let team_id: number
  if (buildingKillEvent) {
    team_id = buildingKillEvent.team_id
  } else if (championKillEvent) {
    const victim = part_dict[championKillEvent.victim_id]
    team_id = victim.team_id === 100 ? 200 : 100
  } else if (turretPlateDestroyedEvent) {
    team_id = turretPlateDestroyedEvent.team_id === 100 ? 200 : 100
  } else if (eliteMonsterKillEvent) {
    team_id = eliteMonsterKillEvent.killer_team_id
  } else {
    console.error('Could not find team id.')
    console.log(ev)
    return null
  }
  const size = 25
  const img_style = {
    height: 35,
    borderRadius: 8,
  }

  const div_style = {
    marginTop: 25,
    display: 'inline-block',
  }

  const red = 'linear-gradient(60deg, rgb(86, 14, 123) 0%, rgb(230, 147, 22) 100%)'
  const blue = 'linear-gradient(66deg, rgb(64, 131, 171) 0%, rgb(15, 63, 123) 100%)'

  let bubble_color = red
  if (team_id === 100) {
    bubble_color = blue
  }

  const sword_style = {
    margin: '5px 10px',
    height: 20,
    transform: 'scaleX(-1)',
  }

  const getKillAssists = (victimdamagereceived_set: VictimDamageType[]) => {
    let out: Record<string, {name: string; damage: number}> = {}
    for (const item of victimdamagereceived_set) {
      const addedDamage = item.physical_damage + item.magic_damage + item.true_damage
      if (out[item.name]) {
        out[item.name].damage += addedDamage
      } else {
        out[item.name] = {
          name: item.name,
          damage: addedDamage,
        }
      }
    }
    return Object.values(out)
  }

  return (
    <div
      key={`event-${ev.x}-${ev.y}`}
      data-html={true}
      style={{
        background: bubble_color,
        width: size,
        height: size,
        left: pos[0],
        bottom: pos[1],
        position: 'absolute',
        borderRadius: '50%',
      }}
      data-tip={ReactDOMServer.renderToString(
        <div>
          {championKillEvent && (
            <div style={div_style}>
              {ev.killer_id !== 0 && (
                <div style={{display: 'inline-block'}}>
                  <img
                    style={img_style}
                    src={champions?.[part_dict[ev.killer_id].champion_id]?.image?.file_40}
                    alt=""
                  />
                </div>
              )}
              {ev.killer_id === 0 && <div>Executed</div>}
              <div
                style={{
                  display: 'inline-block',
                  background: 'white',
                  borderRadius: 8,
                  margin: '0px 5px',
                }}
              >
                <img style={sword_style} src={SWORD} alt="" />
              </div>
              <img
                style={img_style}
                src={
                  champions?.[part_dict[championKillEvent.victim_id].champion_id]?.image?.file_40
                }
                alt=""
              />
              <div className="row col s12">
                {getKillAssists(championKillEvent.victimdamagereceived_set)
                  .sort((a, b) => b.damage - a.damage)
                  .map((item) => {
                    return (
                      <div style={{marginBottom: 0}} className="row" key={item.name}>
                        <div className="col s6">{mapAssistName(item.name)}</div>
                        <div className="col s6">: {item.damage}</div>
                      </div>
                    )
                  })}
              </div>
              <div className="row col s12">
                <div>
                  Kill Gold: <b>{championKillEvent.bounty + championKillEvent.shutdown_bounty}</b> (
                  {championKillEvent.bounty} + {championKillEvent.shutdown_bounty})
                </div>
              </div>
            </div>
          )}

          {eliteMonsterKillEvent && (
            <div style={div_style}>
              {ev.killer_id !== 0 && (
                <React.Fragment>
                  <img
                    style={img_style}
                    src={champions?.[part_dict[ev.killer_id].champion_id]?.image?.file_40}
                    alt=""
                  />
                  <div style={{display: 'inline-block', margin: '0px 8px'}}> killed </div>
                  <span>{eliteMonsterKillEvent.monster_type}</span>
                </React.Fragment>
              )}
              {ev.killer_id === 0 && (
                <div style={{display: 'inline-block'}}>
                  {eliteMonsterKillEvent.monster_type} executed
                </div>
              )}
            </div>
          )}

          {buildingKillEvent && (
            <div style={div_style}>
              {ev.killer_id !== 0 && (
                <img
                  style={img_style}
                  src={champions?.[part_dict[ev.killer_id].champion_id]?.image?.file_40}
                  alt=""
                />
              )}
              {!ev.killer_id && <div style={{display: 'inline-block'}}>minions</div>}
              <div
                style={{
                  display: 'inline-block',
                  background: 'white',
                  borderRadius: 8,
                  margin: '0px 5px',
                }}
              >
                <img style={sword_style} src={SWORD} alt="" />
              </div>
              <span>structure</span>
            </div>
          )}

          {turretPlateDestroyedEvent && (
            <div style={div_style}>
              <div
                style={{
                  display: 'inline-block',
                  background: 'white',
                  borderRadius: 8,
                  margin: '0px 5px',
                }}
              >
                <img style={sword_style} src={SWORD} alt="" />
              </div>
              <span>Turret Plating</span>
            </div>
          )}
        </div>,
      )}
    ></div>
  )
}

function Building({is_alive, pos}: {is_alive: boolean; pos: [number, number]}) {
  const size = 15

  let style = {
    background: 'white',
    border: '3px solid black',
  }
  if (!is_alive) {
    style.background = '#7f3c3c'
    style.border = '3px solid #541616fa'
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: pos[0],
        bottom: pos[1],
        height: size,
        width: size,
        borderRadius: '50%',
        ...style,
      }}
    ></div>
  )
}
