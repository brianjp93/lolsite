import React, {Fragment, useState}  from 'react'
import { Link } from 'react-router-dom'
import AtomSpinner from '@bit/bondz.react-epic-spinners.atom-spinner'
import PropTypes from 'prop-types'
import api from '../../api/api'
import numeral from 'numeral'
import moment from 'moment'
import Item from '../data/Item'
import Modal from 'react-modal'
import MatchCardModal from './MatchCardModal'
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
    if (name.length > 9) {
        return name.slice(0, 9) + '...'
    }
    return name
}

const MODALSTYLE = {
    overlay: {
        zIndex: 2,
        backgroundColor: '#484848b0'
    },
    content : {
        zIndex: 2,
        backgroundColor: '#292E49',
        border: 'none',
    }
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
    const [isModalOpen, setIsModalOpen] = useState(false)
    function openModal() {setIsModalOpen(true)}
    function closeModal() {setIsModalOpen(false)}
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
    const getMaxDamage = match => {
        let max = 0
        for (let player of match.participants) {
            if (player.stats.total_damage_dealt_to_champions > max) {
                max = player.stats.total_damage_dealt_to_champions
            }
        }
        return max
    }
    const getDamagePercentage = (part, match) => {
        let perc = part.stats.total_damage_dealt_to_champions / getMaxDamage(match) * 100
        perc = Math.round(perc)
        return perc
    }
    const getTotalKills = match => {
        let team100 = match.participants.filter(part => part.team_id === 100)
        let team200 = match.participants.filter(part => part.team_id === 200)

        let kills = {
            100: 0,
            200: 0
        }
        let part
        for (part of team100) {
            kills[100] = kills[100] + part.stats.kills
        }
        for (part of team200) {
            kills[200] = kills[200] + part.stats.kills
        }
        return kills
    }
    const getKp = (match, part) => {
        var team_id = part.team_id
        var total = getTotalKills(match)[team_id]
        var kills_and_assists = part.stats.kills + part.stats.assists
        var percentage = 0
        if (total > 0) {
            percentage = (kills_and_assists / total) * 100
        }
        return percentage
    }
    const getTeamMaxKp = (match, team_id) => {
        let max = 0
        let kp
        for (let part of match.participants) {
            if (part.team_id === team_id) {
                kp = getKp(match, part)
                if (kp > max) {
                    max = kp
                }
            }
        }
        return max
    }
    const getTeamKpPercentage = (match, part) => {
        let kp = getKp(match, part)
        let max = getTeamMaxKp(match, part.team_id)
        let perc = kp / max * 100
        return perc
    }
    const getTeam = (team_id) => {
        let team = match.participants.filter((participant) => participant.team_id === team_id)
        return (
            <div>
                {team.map(part => {
                    let dmg_perc = getDamagePercentage(part, match)
                    let wid = dmg_perc * .90

                    let kp = getKp(match, part)
                    let kp_perc = getTeamKpPercentage(match, part)
                    let kp_wid = kp_perc * .90

                    if (kp_wid < 0) {
                        kp_wid = 0
                    }
                    if (wid < 0) {
                        wid = 0
                    }
                    let is_me = part.account_id === mypart.account_id
                    return (
                        <div key={`${match.id}-${part._id}`} style={{position: 'relative'}}>

                            {/* KP PERCENTAGE */}
                            <div
                                title={`${numeral(kp).format('0')}% kp`}
                                style={{
                                    title: `${kp}% kp`,
                                    position: 'absolute',
                                    left: 17,
                                    top: 2,
                                    height: 3,
                                    borderRadius: 10,
                                    width: `${kp_wid}%`,
                                    background: is_me ? '#4b9bcd': '#4b9bcd60'}}>
                            </div>

                            {/* DAMAGE PERCENTAGE */}
                            <div
                                title={`${numeral(part.stats.total_damage_dealt_to_champions).format('0,0')} damage to champions`}
                                style={{
                                    position: 'absolute',
                                    left: 17,
                                    top: 15,
                                    height: 3,
                                    borderRadius: 10,
                                    width: `${wid}%`,
                                    background: is_me ? '#dc5f5f': '#dc5f5f60'}}>
                            </div>

                            <img src={part.champion.image_url} alt={part.champion.name}
                                style={{height: 15, borderRadius: 5, paddingRight: 2}} />
                            <div
                                title={part.summoner_name}
                                style={{
                                    position: 'relative',
                                    fontSize: 'smaller',
                                    display: 'inline-block',
                                    verticalAlign: 'top',
                                }}
                                key={`${match._id}-${part._id}`}>

                                {is_me &&
                                    <small style={{fontWeight:'bold'}}>
                                        {formatName(part.summoner_name)}
                                    </small>
                                }
                                {!is_me &&
                                    <small>
                                        {part.account_id !== '0' &&
                                            <Link
                                                target='_blank'
                                                title={part.summoner_name}
                                                className={`${theme} silent`}
                                                to={`/${pageStore.props.region}/${part.summoner_name}/`}>
                                                {formatName(part.summoner_name)}
                                            </Link>
                                        }
                                        {part.account_id === '0' &&
                                            <span title={part.summoner_name}>
                                                {formatName(part.summoner_name)}
                                            </span>
                                        }
                                    </small>
                                }
                            </div>
                            <small
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 2,
                                    fontSize: 'x-small'
                                }}>
                                {part.stats.kills}/{part.stats.deaths}/{part.stats.assists}
                            </small>
                        </div>
                    )
                })}
            </div>
        )
    }
    const TEAMSWIDTH = 120
    const TOPPAD = 20
    return (
        <div
            style = {{
                    width: 600,
                    height: 130,
                    paddingTop: 15,
                    paddingBottom: 10,
                    position: 'relative',
                }}
            className={`card-panel ${theme}`}>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                style={MODALSTYLE} >
                    <MatchCardModal />
            </Modal>

            <div
                style={{
                    display: 'inline-block',
                    width: 6,
                    height: 90,
                    background: `${topBarColor()}`,
                    borderRadius: 2,
                    marginLeft: -15,
                    marginRight: 8,
                }} >
            </div>
            <div
                style={{
                    display: 'inline-block',
                    paddingRight:5,
                    verticalAlign: 'top',
                    paddingTop: TOPPAD,
            }}>
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

            <span
                style = {{
                    display: 'inline-block',
                    verticalAlign: 'top',
                    paddingTop: TOPPAD
                }}>
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
                    textAlign: 'center',
                    verticalAlign: 'top',
                    paddingTop: TOPPAD,
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

            <div
                style={{
                    display: 'inline-block',
                    width: TEAMSWIDTH,
                }}>
                {getTeam(100)}
            </div>
            <div style={{display: 'inline-block', width: 8}}>
            </div>
            <div
                style={{
                    display: 'inline-block',
                    width: TEAMSWIDTH,
                }}>
                {getTeam(200)}
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 26
                }} >
                <small title={formatDatetimeFull(match.game_creation)} style={{lineHeight:1, display: 'inline-block'}}>
                    {formatDatetime(match.game_creation)}
                </small>
                <small style={{lineHeight:1, display:'inline-block', paddingLeft: 10}}>
                    {`${Math.floor(match.game_duration / 60)}:${numeral(match.game_duration % 60).format('00')}`}
                </small>
            </div>

            <div
                style={{display: 'block', position: 'absolute', bottom: 3, left: 26}}>
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

            <div
                style = {{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    backgroundColor: '#ffffff20',
                    width: 40,
                    height: 130,
                    textAlign: 'center'
                }}
                onClick={openModal} >
                <i className='material-icons'>arrow_downward</i>
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
