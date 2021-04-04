import React, { useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'
import api from '../../api/api'
import toastr from 'toastr'

function BuildOrder(props) {
    const [participant_selection, setParticipantSelection] = useState(props.my_part._id)
    const [purchase_history, setPurchaseHistory] = useState({})
    const [skills, setSkillsHistory] = useState({})
    const [items, setItems] = useState({})

    // build or skill
    const [display_page, setDisplayPage] = useState('build')

    const image_width = 30
    const usable_width = props.expanded_width - 30
    const available_width = usable_width - props.participants.length * image_width
    const padding_pixels = available_width / props.participants.length
    const participants = [
        ...props.participants.filter(participant => participant.team_id === 100),
        ...props.participants.filter(participant => participant.team_id === 200),
    ]

    const participant_data = useMemo(() => {
        for (var part of props.participants) {
            if (part._id === participant_selection) {
                return part
            }
        }
        return null
    }, [props.participants, participant_selection])

    const participant_groups = useMemo(() => {
        let groups = []
        if (purchase_history[participant_selection] !== undefined) {
            for (let i in purchase_history[participant_selection]) {
                let group = purchase_history[participant_selection][i]
                group.count = 1
                groups.push(group)
            }
        }

        let groups_with_count = []
        for (let group of groups) {
            let group_count = {}
            for (let event of group) {
                let key = `${event.item_id}-${event._type}`
                if (group_count[key] === undefined) {
                    event.count = 1
                    group_count[key] = event
                } else {
                    group_count[key].count++
                }
            }
            groups_with_count.push(group_count)
        }
        return groups_with_count
    }, [purchase_history, participant_selection])

    // PURCHASE HISTORY EFFECT
    useEffect(() => {
        let purchase = {}
        if ([null, undefined].indexOf(props.timeline) < 0) {
            for (let i = 0; i < props.timeline.length; i++) {
                let frame = props.timeline[i]
                for (let event of frame.events) {
                    if (['ITEM_PURCHASED', 'ITEM_SOLD'].indexOf(event._type) >= 0) {
                        if (purchase[event.participant_id] === undefined) {
                            purchase[event.participant_id] = {}
                        }
                        if (purchase[event.participant_id][i] === undefined) {
                            purchase[event.participant_id][i] = []
                        }
                        purchase[event.participant_id][i].push(event)
                    }
                }
            }
            setPurchaseHistory(purchase)
        }
    }, [props.timeline])

    // SKILL LEVEL UP HISTORY
    useEffect(() => {
        let skills = {}
        if ([null, undefined].indexOf(props.timeline) < 0) {
            for (let i = 0; i < props.timeline.length; i++) {
                let frame = props.timeline[i]
                for (let event of frame.events) {
                    if (['SKILL_LEVEL_UP'].indexOf(event._type) >= 0) {
                        if (skills[event.participant_id] === undefined) {
                            skills[event.participant_id] = []
                        }
                        skills[event.participant_id].push(event)
                    }
                }
            }
            setSkillsHistory(skills)
        }
    }, [props.timeline])

    // GET ITEMS
    useEffect(() => {
        let item_set = new Set()
        for (let i in purchase_history[participant_selection]) {
            let group = purchase_history[participant_selection][i]
            for (let event of group) {
                if (items[event.item_id] === undefined) {
                    item_set.add(event.item_id)
                }
            }
        }
        let item_list = [...item_set]
        if (item_list.length > 0) {
            api.data.getItem({ item_list: item_list }).then(response => {
                let new_items = { ...items }
                for (let item of response.data.data) {
                    new_items[item._id] = item
                }
                setItems(new_items)
            })
        }
    }, [participant_selection, purchase_history, items])

    let count = 0
    let lines = 1
    return (
        <div style={{ marginLeft: 30 }}>
            {participants.map((participant, index) => {
                return (
                    <ChampionImage
                        key={`${participant._id}-champion-image`}
                        is_me={participant._id === props.my_part._id}
                        is_selected={participant._id === participant_selection}
                        image_width={image_width}
                        participant={participant}
                        padding_pixels={padding_pixels}
                        theme={props.theme}
                        handleClick={event => {
                            if (participant._id !== participant_selection) {
                                setParticipantSelection(participant._id)
                            }
                        }}
                    />
                )
            })}

            <div style={{ marginTop: 5, marginBottom: 5 }} className="row">
                <div className="col s6">
                    <label htmlFor={`${props.match_id}-build-selection`}>
                        <input
                            id={`${props.match_id}-build-selection`}
                            onChange={useCallback(() => setDisplayPage('build'), [])}
                            type="radio"
                            checked={display_page === 'build'}
                        />
                        <span>Build Order</span>
                    </label>
                </div>
                <div className="col s6">
                    <label htmlFor={`${props.match_id}-skill-selection`}>
                        <input
                            id={`${props.match_id}-skill-selection`}
                            onChange={useCallback(() => setDisplayPage('skill'), [])}
                            type="radio"
                            checked={display_page === 'skill'}
                        />
                        <span>Skill Order</span>
                    </label>
                </div>
            </div>

            {display_page === 'build' && (
                <div
                    className="quiet-scroll"
                    style={{ marginTop: 5, overflowY: 'scroll', height: 300, width: 385 }}
                >
                    {participant_groups.map((group, key) => {
                        let total_seconds = Object.values(group)[0].timestamp / 1000
                        let minutes = Math.floor(total_seconds / 60)
                        let seconds = Math.floor(total_seconds % 60)
                        count++
                        let div_style = { display: 'inline-block' }
                        if (count > lines * 9) {
                            lines++
                            div_style = { display: 'block' }
                        }
                        return (
                            <span key={`${props.match_id}-${key}`}>
                                <div style={div_style}></div>
                                <div style={{ display: 'inline-block' }} key={key}>
                                    <div style={{ display: 'block', color: 'grey', width: 50 }}>
                                        {minutes}:{numeral(seconds).format('00')}
                                    </div>
                                    <div>
                                        {Object.values(group).map((event, sub_key) => {
                                            // let event = group[item_id]
                                            if (items[event.item_id] !== undefined) {
                                                let image_style = {}
                                                let action = 'purchased'
                                                if (event._type === 'ITEM_SOLD') {
                                                    action = 'sold'
                                                    image_style = {
                                                        ...image_style,
                                                        opacity: 0.3,
                                                        borderWidth: 3,
                                                        borderStyle: 'solid',
                                                        borderColor: 'darkred',
                                                    }
                                                }
                                                count++
                                                let item_data = items[event.item_id]
                                                let total_seconds = event.timestamp / 1000
                                                let minutes = Math.floor(total_seconds / 60)
                                                let seconds = Math.floor(total_seconds % 60)
                                                return (
                                                    <div
                                                        key={sub_key}
                                                        style={{ display: 'inline-block' }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'inline-block',
                                                                position: 'relative',
                                                            }}
                                                        >
                                                            <ReactTooltip
                                                                id={`${props.match_id}-${item_data._id}-${key}-${sub_key}-tt`}
                                                                effect="solid"
                                                            >
                                                                <h4 style={{ marginBottom: 0 }}>
                                                                    {item_data.name}
                                                                </h4>

                                                                <div style={{ marginBottom: 15 }}>
                                                                    {action} at {minutes}:
                                                                    {numeral(seconds).format('00')}.
                                                                </div>

                                                                <div
                                                                    className="item-description-tt"
                                                                    style={{
                                                                        maxWidth: 500,
                                                                        wordBreak: 'normal',
                                                                        whiteSpace: 'normal',
                                                                    }}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html:
                                                                            item_data.description,
                                                                    }}
                                                                ></div>
                                                            </ReactTooltip>
                                                            <img
                                                                data-tip
                                                                data-for={`${props.match_id}-${item_data._id}-${key}-${sub_key}-tt`}
                                                                style={{
                                                                    width: 30,
                                                                    borderRadius: 5,
                                                                    ...image_style,
                                                                }}
                                                                src={item_data.image.file_30}
                                                                alt=""
                                                            />
                                                            {event.count > 1 && (
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        bottom: 0,
                                                                        right: 0,
                                                                        width: 20,
                                                                        background: 'white',
                                                                        color: 'black',
                                                                        textAlign: 'center',
                                                                        fontSize: 'smaller',
                                                                        borderRadius: 5,
                                                                    }}
                                                                >
                                                                    {event.count}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })}
                                        {key < participant_groups.length - 1 && (
                                            <span>
                                                <i className="small material-icons">
                                                    arrow_forward
                                                </i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </span>
                        )
                    })}
                </div>
            )}
            {display_page === 'skill' && (
                <SkillLevelUp
                    skills={skills[participant_selection]}
                    my_part={props.my_part}
                    selected_participant={participant_data}
                    expanded_width={props.expanded_width}
                />
            )}
        </div>
    )
}
BuildOrder.propTypes = {
    theme: PropTypes.string,
    my_part: PropTypes.object,
    timeline: PropTypes.array,
    participants: PropTypes.array,
    summoner: PropTypes.object,
    expanded_width: PropTypes.number,
    match_id: PropTypes.any,
}

function ChampionImage(props) {
    let image_style = {
        cursor: 'pointer',
        width: 30,
        height: 30,
    }
    if (!props.is_selected) {
        image_style = {
            ...image_style,
            opacity: 0.3,
        }
    } else {
        image_style = {
            ...image_style,
            borderWidth: 3,
            borderColor: 'white',
            borderStyle: 'solid',
        }
    }

    let vert_align = {}
    let champ_image = props.participant.champion?.image?.file_30
    if (champ_image === undefined) {
        vert_align.verticalAlign = 'top'
    }

    return (
        <div style={{ display: 'inline-block', paddingRight: props.padding_pixels, ...vert_align }}>
            {champ_image === undefined && (
                <div
                    onClick={props.handleClick}
                    style={{ display: 'inline-block', ...image_style }}
                >
                    NA
                </div>
            )}
            {champ_image !== undefined && (
                <img
                    onClick={props.handleClick}
                    style={{
                        ...image_style,
                    }}
                    aria-label={props.participant.champion.name}
                    src={props.participant.champion?.image?.file_30}
                    alt=""
                />
            )}
        </div>
    )
}
ChampionImage.propTypes = {
    is_selected: PropTypes.bool,
    participant: PropTypes.object,
    image_width: PropTypes.number,
    padding_pixels: PropTypes.number,
    theme: PropTypes.string,
}

function SkillLevelUp(props) {
    const [spells, setSpells] = useState({})

    useEffect(() => {
        let params = { champion_id: props.selected_participant.champion._id }
        api.data
            .getChampionSpells(params)
            .then(response => {
                let output = {}
                let data = response.data.data
                for (let i = 0; i < data.length; i++) {
                    let spell = data[i]
                    let letter = ['q', 'w', 'e', 'r'][i]
                    // let letter = spell._id[spell._id.length - 1].toLowerCase()
                    output[letter] = spell
                }
                setSpells(output)
            })
            .catch(error => {
                toastr.error('Error while getting champion abilities.')
            })
    }, [props.selected_participant])

    let div_width = (props.expanded_width - 65) / 18
    let div_height = 30
    return (
        <div>
            {props.skills !== undefined &&
                [...Array(19).keys()].map(num => {
                    let skill = props.skills[num - 1]
                    return (
                        <div key={num} style={{ display: 'inline-block' }}>
                            {['lvl', 'q', 'w', 'e', 'r'].map((skill_num, key) => {
                                let output = '.'
                                let div_style = {
                                    height: div_height,
                                    width: div_width,
                                    borderStyle: 'solid',
                                    borderColor: 'grey',
                                    borderWidth: 1,
                                }
                                if (num === 0) {
                                    div_style = {
                                        height: div_height,
                                        width: 30,
                                        borderStyle: 'solid',
                                        borderColor: 'grey',
                                        borderWidth: 0,
                                    }
                                    if (['q', 'w', 'e', 'r'].indexOf(skill_num) >= 0) {
                                        output = (
                                            <span>
                                                <ReactTooltip
                                                    id={`${props.selected_participant._id}-${skill_num}-ability`}
                                                    effect="solid"
                                                >
                                                    <div
                                                        style={{
                                                            maxWidth: 500,
                                                            wordBreak: 'normal',
                                                            whiteSpace: 'normal',
                                                        }}
                                                    >
                                                        {spells[skill_num] !== undefined && (
                                                            <div>
                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            display: 'inline-block',
                                                                        }}
                                                                    >
                                                                        <img
                                                                            style={{
                                                                                height: 50,
                                                                                borderRadius: 8,
                                                                            }}
                                                                            src={
                                                                                spells[skill_num]
                                                                                    .image_url
                                                                            }
                                                                            alt=""
                                                                        />
                                                                    </div>
                                                                    <h4
                                                                        style={{
                                                                            display: 'inline-block',
                                                                            marginLeft: 10,
                                                                        }}
                                                                    >
                                                                        {spells[skill_num].name}
                                                                    </h4>
                                                                </div>
                                                                <div
                                                                    dangerouslySetInnerHTML={{
                                                                        __html:
                                                                            spells[skill_num]
                                                                                .description,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ReactTooltip>
                                                <div
                                                    data-tip
                                                    data-for={`${props.selected_participant._id}-${skill_num}-ability`}
                                                    style={{
                                                        width: 30,
                                                        height: 30,
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {skill_num}

                                                    {spells[skill_num] !== undefined && (
                                                        <img
                                                            src={spells[skill_num].image_url}
                                                            alt=""
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: 30,
                                                                borderStyle: 'solid',
                                                                borderColor: 'grey',
                                                                borderWidth: 2,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </span>
                                        )
                                    } else {
                                        output = '.'
                                    }
                                } else if (skill_num === 'lvl') {
                                    div_style = {
                                        ...div_style,
                                        borderStyle: 'none',
                                        borderWidth: 0,
                                    }
                                    output = `${num}`
                                } else if (skill !== undefined && skill.skill_slot === key) {
                                    div_style = {
                                        ...div_style,
                                        textAlign: 'center',
                                        background: '#196893',
                                    }
                                    output = skill_num
                                } else {
                                    output = '.'
                                }
                                return (
                                    <div key={key} style={div_style}>
                                        <span>{output}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
        </div>
    )
}

export default BuildOrder
