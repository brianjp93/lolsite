import React, {useState, useEffect, useCallback} from 'react'
import {buildings_default} from '../../constants/buildings'
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

export function MapEvents(props: {
  summoner: any
  match: FullMatchType
  participants: FullParticipantType[]
  timeline_index: number
  timeline: FrameType[]
  setOuterTimelineIndex: (x: number) => void
  store: any
  route: any
}) {
  const [index, setIndex] = useState(0)
  const [buildings, setBuildings] = useState<any>({})
  const [part_dict, setPartDict] = useState<Record<number, FullParticipantType>>({})
  const [players, setPlayers] = useState<any>([])

  const match = props.match
  const store = props.store
  const theme = store.state.theme
  const timeline = props.timeline
  const participants = props.participants
  const setOuterTimelineIndex = props.setOuterTimelineIndex

  const image_size = 500
  const max_x = 15300
  const max_y = 15000
  const slice = timeline[index]

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
            key={`monster-${ev.timestamp}-${ev.x}`}
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
      if (setOuterTimelineIndex !== undefined) {
        setOuterTimelineIndex(newindex)
      }
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
  }, [index, timeline, buildings, setOuterTimelineIndex])

  const stepBackward = useCallback(() => {
    let newindex = index - 1
    if (newindex >= 0) {
      setIndex(newindex)
      if (setOuterTimelineIndex !== undefined) {
        setOuterTimelineIndex(newindex)
      }
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
  }, [index, timeline, buildings, setOuterTimelineIndex])

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

  return (
    <div style={{display: 'inline-block'}}>
      <div style={{position: 'relative'}}>
        <img
          style={{
            height: image_size,
            borderRadius: 10,
          }}
          src={`${store.state.static}general/map.png`}
          alt="League Map"
        />

        {Object.keys(buildings).map((key) => {
          let data = buildings[key]
          return (
            <Building
              key={`${match.id}-${key}`}
              pos={getPosition(data.x, data.y)}
              team={data.team}
              building_type={data.type}
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
                  src={player.part.champion?.image?.file_30}
                  alt="participant bubble"
                />
              </div>
            )
          })}

        {displayEvents()}
      </div>

      <div>
        <button onClick={stepBackward} className={`${theme} btn-small`}>
          <i className="material-icons">chevron_left</i>
        </button>
        <button style={{marginLeft: 8}} onClick={stepForward} className={`${theme} btn-small`}>
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
  const [is_open, setIsOpen] = useState(false)
  const ev =
    buildingKillEvent || championKillEvent || turretPlateDestroyedEvent || eliteMonsterKillEvent
  if (!ev) {
    return null
  }
  const part = part_dict[ev.killer_id]
  let team_id: number
  if (buildingKillEvent) {
    team_id = buildingKillEvent.team_id
  } else if (championKillEvent) {
    team_id = part.team_id
  } else if (turretPlateDestroyedEvent) {
    team_id = turretPlateDestroyedEvent.team_id
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
  let bubble_color = red
  const blue = 'linear-gradient(66deg, rgb(64, 131, 171) 0%, rgb(15, 63, 123) 100%)'
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
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{
        background: bubble_color,
        width: size,
        height: size,
        left: pos[0],
        bottom: pos[1],
        position: 'absolute',
        borderRadius: '50%',
      }}
    >
      <div style={{position: 'relative'}}>
        {is_open && (
          <div
            // onMouseEnter={() => setIsOpen(false)}
            style={{
              width: 300,
              height: 100,
              position: 'absolute',
              bottom: 5,
              left: -140,
              background: 'black',
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 20,
            }}
          >
            {championKillEvent && (
              <div style={div_style}>
                {ev.killer_id !== 0 && (
                  <div style={{display: 'inline-block'}}>
                    <img
                      style={img_style}
                      src={part_dict[ev.killer_id].champion?.image?.file_40}
                      alt=""
                    />
                    {getKillAssists(championKillEvent.victimdamagereceived_set).map((item) => {
                      return (
                        <div key={item.name}>
                          {item.name}: {item.damage} dmg
                        </div>
                      )
                    })}
                  </div>
                )}
                <div
                  style={{
                    display: 'inline-block',
                    background: 'white',
                    borderRadius: 8,
                    margin: '0px 5px',
                  }}
                >
                  <img
                    style={sword_style}
                    src="https://image.flaticon.com/icons/svg/65/65741.svg"
                    alt=""
                  />
                </div>
                <img
                  style={img_style}
                  src={part_dict[championKillEvent.victim_id].champion?.image?.file_40}
                  alt=""
                />
              </div>
            )}

            {eliteMonsterKillEvent && (
              <div style={div_style}>
                {ev.killer_id !== 0 && (
                  <React.Fragment>
                    <img
                      style={img_style}
                      src={part_dict[ev.killer_id].champion?.image?.file_40}
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
                    src={part_dict[ev.killer_id].champion?.image?.file_40}
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
                  <img
                    style={sword_style}
                    src="https://image.flaticon.com/icons/svg/65/65741.svg"
                    alt=""
                  />
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
                  <img
                    style={sword_style}
                    src="https://image.flaticon.com/icons/svg/65/65741.svg"
                    alt=""
                  />
                </div>
                <span>Turret Plating</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Building(props: any) {
  const is_alive = props.is_alive
  const pos = props.pos

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
