import React, {Fragment, useState}  from 'react'
import { Link } from 'react-router-dom'
import AtomSpinner from '@bit/bondz.react-epic-spinners.atom-spinner'
import PropTypes from 'prop-types'
import api from '../../api/api'
import numeral from 'numeral'
import moment from 'moment'
import Item from '../data/Item'
import ReactTooltip from 'react-tooltip'
// import StatPie from './StatPie'
import StatOverview from './StatOverview'
import RunePage from './RunePage'
import BuildOrder from './BuildOrder'
import ChampionTimelines from './ChampionTimelines'
import {
    ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'


function formatDatetime(epoch) {
    return moment(epoch).format('MMM D, h:mm a')
}

function formatDatetimeFull(epoch) {
    return moment(epoch).format('MMM D, YYYY h:mm a')
}

function formatName(name) {
    if (name.length > 6) {
        return name.slice(0, 6) + '...'
    }
    return name
}

function matchHighlightColor(queue_id) {
    var out = ''
    // ranked 5v5 solo
    if (queue_id === 420) {
        out = 'highlight1'
    }
    // norms draft
    else if (queue_id === 400) {
        out = ''
    }
    // ranked 5v5 flex
    else if (queue_id === 440) {
        out = 'highlight2'
    }
    // aram
    else if ([100, 450].indexOf(queue_id >= 0)) {
        out = 'highlight3'
    }
    else if ([900, 1010].indexOf(queue_id >= 0)) {
        out = 'highlight4'
    }
    // 3v3 ranked
    else if ([470].indexOf(queue_id >= 0)) {
        out = 'highlight5'
    }
    else if ([850].indexOf(queue_id >= 0)) {
        out = 'highlight6'
    }
    return out
}


function MatchCard(props) {
    const theme = props.store.state.theme
    const match = props.match
    const store = props.store
    const pageStore = props.pageStore
    const retrieveItem = (item_id, major, minor) => {
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
    const getMyPart = () => {
        // get my participant
        let account_id = props.pageStore.state.summoner.account_id
        for (let part of match.participants) {
            if (part.account_id === account_id) {
                return part
            }
        }
    }
    const mypart = getMyPart()
    const game_time = match.game_duration / 60
    const dpm = mypart.stats.total_damage_dealt_to_champions / (match.game_duration / 60)
    const vision_score_per_minute = mypart.stats.vision_score / game_time
    const damage_taken_per_minute = mypart.stats.total_damage_taken / game_time
    const csm = (mypart.stats.total_minions_killed + mypart.stats.neutral_minions_killed) / game_time
    const getItem = (item_id, major, minor) => {
        // request item info if it isn't in the store
        let version = `${major}.${minor}`
        let store = props.store
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
    const item = (id, image_url) => {
        const item_data = retrieveItem(id, match.major, match.minor)
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
    const isLoss = () => {
        let part = mypart
        let team_id = part.team_id
        let seconds = match.game_duration
        if (seconds / 60 < 5) {
            return false
        }
        for (let team of match.teams) {
            if (team._id === team_id) {
                if (team.win_str === 'Fail') {
                    return true
                }
            }
        }
        return false
    }
    const isVictory = () => {
        let part = mypart
        let team_id = part.team_id
        let seconds = match.game_duration
        if (seconds / 60 < 5) {
            return false
        }
        for (let team of match.teams) {
            if (team._id === team_id) {
                if (team.win_str === 'Win') {
                    return true
                }
            }
        }
        return false
    }
    const topBarColor = () => {
        if (isVictory(match)) {
            return props.pageStore.state.victory_color
        }
        else if (isLoss(match)) {
            return props.pageStore.state.loss_color
        }
        else {
            return props.pageStore.state.neutral_color
        }
    }
    const getKDA = part => {
        let k = part.stats.kills
        let a = part.stats.assists
        let d = part.stats.deaths
        if (d < 1) {
            d = 1
        }
        let kda = (k + a) / d
        kda = Math.round(kda * 100) / 100
        return kda
    }
    const kda = getKDA(mypart)
    const convertQueue = queue => {
        let convert = {
            'Co-op vs. AI Intermediate Bot':  'Co-op vs Bots Int'
        }
        if (convert[queue] !== undefined) {
            return convert[queue]
        }
        return queue
    }
    const getTeam = (team_id) => {
        let team = match.participants.filter((participant) => participant.team_id === team_id)
        console.log(team)
        return (
            <div>
                {team.map(part => {
                    return (
                        <div>
                            <img src={part.champion.image_url} alt={part.champion.name}
                                style={{height: 15, borderRadius: 5}} />
                            <div
                                title={part.summoner_name}
                                style={{
                                    fontSize: 'smaller',
                                    display: 'inline-block'
                                }}
                                key={`${match._id}-${part._id}`}>
                                {formatName(part.summoner_name)}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    return (
        <div
            style={{
                    width: 500,
                    paddingTop: 15,
                    paddingBottom: 10,
                    position: 'relative',
                }}
            className={`card-panel ${theme}`}>
            <div
                style={{
                    display: 'inline-block',
                    width: 6,
                    height: 80,
                    background: `${topBarColor()}`,
                    borderRadius: 2,
                    marginLeft: -15,
                    marginRight: 8,
                }} >
            </div>
            <div style={{display: 'inline-block', paddingRight:5}}>
                <div>
                    <img
                        style={{height: 40, display:'inline'}}
                        src={mypart.champion.image_url}
                        alt=""/>
                    <div style={{display:'inline-block', paddingLeft:4}}>
                        <img
                            style={{height:20, display:'block'}}
                            src={mypart.spell_1_image_url} alt="" />
                        <img
                            style={{height:20, display:'block'}}
                            src={mypart.spell_2_image_url} alt="" />
                    </div>
                </div>
                <img
                    style={{height: 20, verticalAlign: 'top'}}
                    src={mypart.stats.perk_0_image_url}
                    alt=""/>
                <img
                    style={{height: 20, verticalAlign: 'top'}}
                    src={mypart.stats.perk_sub_style_image_url}
                    alt=""/>
                <img
                    style={{
                        height: 20,
                        verticalAlign: 'top',
                        marginLeft: 4,
                        borderRadius: 5,
                    }}
                    src={mypart.stats.item_6_image_url} alt=""/>
            </div>

            <span style={{display: 'inline-block'}}>
                <div style={{width:100}}>
                    <span>
                        {item(mypart.stats.item_0, mypart.stats.item_0_image_url)}
                    </span>
                    <span>
                        {item(mypart.stats.item_1, mypart.stats.item_1_image_url)}
                    </span>
                    <span>
                        {item(mypart.stats.item_2, mypart.stats.item_2_image_url)}
                    </span>
                </div>
                <div style={{width:100}}>
                    <span>
                        {item(mypart.stats.item_3, mypart.stats.item_3_image_url)}
                    </span>
                    <span>
                        {item(mypart.stats.item_4, mypart.stats.item_4_image_url)}
                    </span>
                    <span>
                        {item(mypart.stats.item_5, mypart.stats.item_5_image_url)}
                    </span>
                </div>
            </span>

            <div style={{
                    display: 'inline-block',
                    width: 100,
                    textAlign: 'center'
                }}>
                <div style={{fontSize: 'small'}}>
                    {kda} KDA
                </div>
                <div style={{fontSize: 'small'}}>
                    {numeral(dpm).format('0,0')} DPM
                </div>
                <div style={{fontSize: 'small'}}>
                    {numeral(vision_score_per_minute).format('0,0.00')} VS/M
                </div>
            </div>

            <div style={{display: 'inline-block'}}>
                {getTeam(100)}
            </div>
            <div style={{display: 'inline-block', width: 8}}>
            </div>
            <div style={{display: 'inline-block'}}>
                {getTeam(200)}
            </div>

            <div style={{
                position: 'absolute',
                top: 0,
                right: 5}} >
                <small title={formatDatetimeFull(match.game_creation)} style={{lineHeight:1, display: 'inline-block'}}>
                    {formatDatetime(match.game_creation)}
                </small>
                <small style={{lineHeight:1, display:'inline-block', paddingLeft: 10}}>
                    {`${Math.floor(match.game_duration / 60)}:${numeral(match.game_duration % 60).format('00')}`}
                </small>
            </div>

            <div
                style={{display: 'block', position: 'absolute', bottom: 3, right: 5}}>
                <small className={`${store.state.theme} ${matchHighlightColor(match.queue_id)}`}>
                    {pageStore.state.queues[match.queue_id] &&
                        <Fragment>
                            {convertQueue(pageStore.state.queues[match.queue_id].description)}
                        </Fragment>
                    }
                    {pageStore.state.queues[match.queue_id] === undefined &&
                        <Fragment>
                            {match.queue_id}
                        </Fragment>
                    }
                </small>
            </div>
        </div>
    )
}
MatchCard.propTypes = {
    match: PropTypes.object,
    mypart: PropTypes.object,
    store: PropTypes.object,
    pageStore: PropTypes.object,
}

export default MatchCard

