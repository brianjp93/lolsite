import React, { useState, useEffect, useCallback } from 'react'
import { buildings_default } from '../../constants/buildings'


export function MapEvents(props) {
    const [index, setIndex] = useState(0)
    const [buildings, setBuildings] = useState({})
    const [part_dict, setPartDict] = useState({})
    const [players, setPlayers] = useState([])

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
    const events = slice.events

    function getPosition(x, y) {
        let x_val = x/max_x*image_size
        let y_val = y/max_y*image_size
        return [x_val, y_val]
    }

    const displayEvents = useCallback(() => {
        return (
            events.map(ev => {
                if (ev.x && ev.y) {
                    const pos = getPosition(ev.x, ev.y)
                    return (
                        <EventBubble
                            key={`${ev.timestamp}-${ev.x}`}
                            part_dict={part_dict} ev={ev} pos={pos} />
                    )
                }
                return null
            }))
    }, [events, part_dict])

    const stepForward = useCallback(() => {
        let newindex = index + 1
        if (newindex < timeline.length) {
            setIndex(newindex)
            if (setOuterTimelineIndex !== undefined) {
                setOuterTimelineIndex(newindex)
            }
            let new_buildings = {...buildings}
            let events = timeline[newindex].events
            for (let ev of events) {
                if (ev._type === 'BUILDING_KILL') {
                    let team = 'BLUE'
                    if (ev.team_id === 200) {
                        team = 'RED'
                    }
                    let key = `${team}-${ev.building_type}-${ev.lane_type}-${ev.tower_type}`
                    if (new_buildings[key] !== undefined) {
                        new_buildings[key].is_alive = false
                    }
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
            let events = timeline[newindex+1].events
            for (let ev of events) {
                if (ev._type === 'BUILDING_KILL') {
                    let team = 'BLUE'
                    if (ev.team_id === 200) {
                        team = 'RED'
                    }
                    let key = `${team}-${ev.building_type}-${ev.lane_type}-${ev.tower_type}`
                    if (new_buildings[key] !== undefined) {
                        new_buildings[key].is_alive = true
                    }
                }
            }
            setBuildings(new_buildings)
        }
    }, [index, timeline, buildings, setOuterTimelineIndex])

    const getPlayers = useCallback(function() {
        let new_players = []
        for (let pframe of slice.participantframes) {
            let part = part_dict[pframe.participant_id]
            new_players.push({pframe, part})
        }
        setPlayers(new_players)
    }, [slice, part_dict])

    useEffect(() => {
        if (participants.length > 0) {
            let data = {}
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
        let new_buildings = {...buildings_default}
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
                    src="https://i.imgur.com/6178wnB.png"
                    alt="League Map" />

                {Object.keys(buildings).map(key => {
                    let data = buildings[key]
                    return (
                        <Building
                            key={`${match.id}-${key}`}
                            pos={getPosition(data.x, data.y)}
                            team={data.team}
                            building_type={data.type}
                            is_alive={data.is_alive} />
                    )
                })}

                {players.length > 0 && players.map(player => {
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
                            }}>
                            <img
                                style={{
                                    width: 25, borderRadius: '50%',
                                    border: `2px solid ${border_color}`
                                }}
                                src={player.part.champion?.thumbs?.file_30}
                                alt="participant bubble" />
                        </div>
                    )
                })}

                {displayEvents()}
            </div>

            <div>
                <button
                    onClick={stepBackward}
                    className={`${theme} btn-small`}>
                    <i className="material-icons">chevron_left</i>
                </button>
                <button
                    style={{marginLeft: 8}}
                    onClick={stepForward}
                    className={`${theme} btn-small`}>
                    <i className="material-icons">chevron_right</i>
                </button>
                <div style={{marginLeft: 8, display: 'inline-block'}}>
                    {index} min
                </div>
            </div>

        </div>
    )
}


function EventBubble(props) {
    const [is_open, setIsOpen] = useState(false)

    const ev = props.ev
    const pos = props.pos
    const part_dict = props.part_dict
    const size = 25
    const img_style = {
        height: 35,
        borderRadius: 8,
    }

    const div_style = {
        marginTop: 25,
        display: 'inline-block',
    }

    let bubble_color = 'linear-gradient(60deg, rgb(86, 14, 123) 0%, rgb(230, 147, 22) 100%)'
    const blue = 'linear-gradient(66deg, rgb(64, 131, 171) 0%, rgb(15, 63, 123) 100%)'
    if (['CHAMPION_KILL', 'ELITE_MONSTER_KILL'].indexOf(ev._type) >= 0) {
        if (ev.killer_id) {
            let part = part_dict[ev.killer_id]
            if (part.team_id === 100) {
                bubble_color = blue
            }
        }
        else {
            bubble_color = 'grey'
        }
    }
    else {
        if (ev.team_id === 200) {
            bubble_color = blue
        }
    }

    const sword_style = {
        margin: '5px 10px',
        height: 20,
        transform: 'scaleX(-1)'
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
                borderRadius: '50%'}}>
            <div style={{position: 'relative'}}>
                {is_open &&
                    <div
                        onMouseEnter={() => setIsOpen(false)}
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
                        }}>
                        {ev._type === 'CHAMPION_KILL' &&
                            <div
                                style={div_style}>
                                {ev.killer_id !== 0 &&
                                    <img
                                        style={img_style}
                                        src={part_dict[ev.killer_id].champion?.thumbs?.file_40} alt="" />
                                }
                                <div
                                    style={{
                                        display: 'inline-block',
                                        background: 'white',
                                        borderRadius: 8,
                                        margin: '0px 5px',
                                    }}>
                                    <img
                                        style={sword_style}
                                        src='https://image.flaticon.com/icons/svg/65/65741.svg' alt="" />
                                </div>
                                <img
                                    style={img_style}
                                    src={part_dict[ev.victim_id].champion?.thumbs?.file_40} alt="" />
                            </div>
                        }

                        {ev._type === 'ELITE_MONSTER_KILL' &&
                            <div
                                style={div_style}>
                                {ev.killer_id !== 0 &&
                                    <React.Fragment>
                                        <img
                                            style={img_style}
                                            src={part_dict[ev.killer_id].champion?.thumbs?.file_40} alt="" />
                                                <div style={{display: 'inline-block', margin: '0px 8px'}}> killed </div>
                                                <span>{ev.monster_type}</span>
                                    </React.Fragment>
                                }
                                {ev.killer_id === 0 &&
                                    <div style={{display: 'inline-block'}}>
                                        {ev.monster_type} executed
                                    </div>
                                }
                            </div>
                        }

                        {ev._type === 'BUILDING_KILL' &&
                            <div
                                style={div_style}>
                                {ev.killer_id !== 0 &&
                                    <img
                                        style={img_style}
                                        src={part_dict[ev.killer_id].champion?.thumbs?.file_40} alt="" />
                                }
                                {!ev.killer_id &&
                                    <div style={{display: 'inline-block'}}>minions</div>
                                }
                                <div
                                    style={{
                                        display: 'inline-block',
                                        background: 'white',
                                        borderRadius: 8,
                                        margin: '0px 5px',
                                    }}>
                                    <img
                                        style={sword_style}
                                        src='https://image.flaticon.com/icons/svg/65/65741.svg' alt="" />
                                </div>
                                <span>structure</span>
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    )
}


function Building(props) {
    const is_alive = props.is_alive
    const pos = props.pos

    const size = 15

    let style = {
        background: 'white',
        border: '3px solid black'
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
            }}>
        </div>
    )
}

