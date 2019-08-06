import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'
import api from '../../api/api'


function BuildOrder(props) {
    const [participant_selection, setParticipantSelection] = useState(props.my_part._id)
    const [purchase_history, setPurchaseHistory] = useState({})
    const [items, setItems] = useState({})

    const image_width = 30
    const usable_width = props.expanded_width - 30
    const available_width = (usable_width - (props.participants.length * image_width))
    const padding_pixels = available_width / props.participants.length
    const participants = [
        ...props.participants.filter(participant => participant.team_id === 100),
        ...props.participants.filter(participant => participant.team_id === 200)
    ]

    const participant_groups = useMemo(() => {
        let groups = []
        if (purchase_history[participant_selection] !== undefined) {
            for (let i in purchase_history[participant_selection]) {
                let group = purchase_history[participant_selection][i]
                groups.push(group)
            }
        }
        return groups
    }, [purchase_history, participant_selection])

    // PURCHASE HISTORY EFFECT
    useEffect(() => {
        let purchase = {}
        if ([null, undefined].indexOf(props.timeline) < 0) {
            for (let i=0; i<props.timeline.length; i++) {
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

    // GET ITEMS
    useEffect(() => {
        let item_set = new Set()
        for (let i in purchase_history[participant_selection]) {
            let group = purchase_history[participant_selection][i]
            for (let event of group) {
                if (items[ event.item_id ] === undefined) {
                    item_set.add(event.item_id)
                }
            }
        }
        let item_list = [...item_set]
        if (item_list.length > 0) {
            api.data.getItem({item_list: item_list})
                .then(response => {
                    let new_items = {...items}
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
        <div style={{marginLeft: 30}}>
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
                        }} />
                )
            })}
            
            <div style={{marginTop: 5}}>
                {participant_groups.map((group, key) => {
                    let total_seconds = group[0].timestamp / 1000
                    let minutes = Math.floor(total_seconds / 60)
                    let seconds = Math.floor(total_seconds % 60)
                    count++
                    let div_style = {display: 'inline-block'}
                    if (count > (lines * 9)) {
                        lines++
                        div_style = {display: 'block'}
                    }
                    return (
                        <span key={key}>
                            <div style={div_style}>
                                    
                            </div>
                            <div style={{display: 'inline-block'}} key={key}>
                                <div style={{display: 'block', color: 'grey', width: 50}}>
                                    {minutes}:{numeral(seconds).format('00')}
                                </div>
                                <div>
                                    {group.map((event, sub_key) => {
                                        if (items[event.item_id] !== undefined) {
                                            let image_style = {}
                                            let action = 'purchased'
                                            if (event._type === 'ITEM_SOLD') {
                                                action = 'sold'
                                                image_style = {
                                                    ...image_style,
                                                    opacity: .3,
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
                                                <div key={sub_key} style={{display: 'inline-block'}}>
                                                    <div style={{display: 'inline-block'}}>
                                                        <ReactTooltip
                                                            id={`${item_data._id}-${sub_key}-tt`}
                                                            effect='solid' >
                                                            <h4 style={{marginBottom: 0}}>{item_data.name}</h4>

                                                            <div style={{marginBottom: 15}}>{action} at {minutes}:{numeral(seconds).format('00')}.</div>

                                                            <div
                                                                className='item-description-tt'
                                                                style={{maxWidth: 500, wordBreak: 'break-all', whiteSpace: 'normal'}}
                                                                dangerouslySetInnerHTML={{__html: item_data.description}}>
                                                            </div>
                                                        </ReactTooltip>
                                                        <img
                                                            data-tip
                                                            data-for={`${item_data._id}-${sub_key}-tt`}
                                                            style={{width: 30, borderRadius: 5, ...image_style}}
                                                            src={item_data.image_url} alt=""/>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })}
                                    {key < participant_groups.length - 1 &&
                                        <span><i className="small material-icons">arrow_forward</i></span>
                                    }
                                </div>
                            </div>
                        </span>
                    )
                })}
            </div>
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
}

function ChampionImage(props) {
    let image_style = {}
    if (!props.is_selected) {
        image_style = {
            ...image_style,
            opacity: .3,
        }
    }
    else {
        image_style = {
            ...image_style,
            borderWidth: 3,
            borderColor: 'white',
            borderStyle: 'solid',
        }
    }
    return (
        <div style={{display: 'inline-block', paddingRight: props.padding_pixels}}>
            <img
                onClick={props.handleClick}
                style={{
                    cursor: 'pointer',
                    width: 30,
                    ...image_style
                }}
                aria-label={props.participant.champion.name}
                src={props.participant.champion.image_url}
                alt=""/>
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

export default BuildOrder