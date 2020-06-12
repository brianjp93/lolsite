import React from 'react'
import moment from 'moment'
import Item from '../components/data/Item'
import api from '../api/api'


export function formatDatetime(epoch) {
    return moment(epoch).format('MMM D h:mm a')
}

export function formatDatetimeFull(epoch) {
    return moment(epoch).format('MMM D, YYYY h:mm a')
}

export function getTeam(num, participants) {
    return participants.filter(item => item.team_id === num)
}

export function convertTier(tier) {
    let out = ''
    if (tier.toLowerCase() === 'grandmaster') {
        out = 'GM'
    }
    else {
        out = tier[0]
    }
    return out
}

export function convertRank(rank) {
    let out = rank
    let dict = {
        'I': '1',
        'II': '2',
        'III': '3',
        'IV': '4',
        'V': '5',
    }
    if (dict[rank] !== undefined) {
        out = dict[rank]
    }
    return out
}

function getItem(item_id, major, minor, store) {
    // request item info if it isn't in the store
    let version = `${major}.${minor}`
    let item = null
    let items = store.state.items

    // if the item already exists, set item equal to it
    if (items[version] !== undefined) {
        if (items[version][item_id] !== undefined) {
            item = items[version][item_id]
        }
    }
    // if the item doesn't exists yet, get it
    if (item === null) {
        let data = {
            item_id,
            major,
            minor,
        }
        api.data.getItem(data)
            .then(response => {
                if (items[version] === undefined) {
                    items[version] = {}
                }
                items[version][item_id] = response.data.data
                store.setState({items: items})
            })
    }
    return item
}

function retrieveItem (item_id, major, minor, store) {
    // get item from store
    let version = `${major}.${minor}`
    let item = null
    let items = store.state.items
    if (items[version] !== undefined) {
        if (items[version][item_id] !== undefined) {
            item = items[version][item_id]
        }
    }
    return item
}

function item(id, image_url, match, store) {
    const item_data = retrieveItem(id, match.major, match.minor, store)
    return (
        <Item.ItemPopover
            style={{
                display: 'inline-block',
                height:28, width:28,
                margin:'0px 2px',
            }}
            item={item_data}
            tooltip_style={store.state.tooltip_style}
            getItem={getItem}
            store={store}
            item_id={id}
            major={match.major}
            minor={match.minor}>
            <div style={{
                display: 'inline-block',
                height:28, width:28,
                borderRadius:10,
                margin:'0px 2px',
                borderStyle:'solid',
                borderColor:'#2d2e31',
                borderWidth:1}}>
                <img
                    style={{height:'100%', borderRadius:10, display:'inline-block'}}
                    src={image_url} alt=""/>
            </div>
        </Item.ItemPopover>
    )
}

export function participantItems(part, match, store) {
    return (
        <div
            style = {{
                display: 'inline-block',
                verticalAlign: 'top',
            }}>
            <div style={{width:100}}>
                <span>
                    {item(part.stats.item_0, part.stats.item_0_image_url, match, store)}
                </span>
                <span>
                    {item(part.stats.item_1, part.stats.item_1_image_url, match, store)}
                </span>
                <span>
                    {item(part.stats.item_2, part.stats.item_2_image_url, match, store)}
                </span>
            </div>
            <div style={{width:100}}>
                <span>
                    {item(part.stats.item_3, part.stats.item_3_image_url, match, store)}
                </span>
                <span>
                    {item(part.stats.item_4, part.stats.item_4_image_url, match, store)}
                </span>
                <span>
                    {item(part.stats.item_5, part.stats.item_5_image_url, match, store)}
                </span>
            </div>
        </div>
    )
}

export function getMyPart(participants, account_id) {
    for (let part of participants) {
        if (part.current_account_id === account_id || part.account_id === account_id) {
            return part
        }
    }
    return undefined
}

