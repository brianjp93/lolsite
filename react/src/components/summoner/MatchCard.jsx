import React, { Component } from 'react'
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
import ChampionTimelines from './ChampionTimelines'
import {
    ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'


function formatDatetime(epoch) {
    return moment(epoch).format('MMM DD h:mm a')
}

function formatDatetimeFull(epoch) {
    return moment(epoch).format('MMM DD, YYYY h:mm a')
}


class MatchCard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            summary_width: 280,
            expanded_width: 700,

            is_expanded: false,

            card_horizontal_padding: 18,

            is_attempt_get_full_match: false,
            is_loading_full_match: false,
            full_match: null,
            participants: null,
            timeline: null,

            timeline_index: null,

            expanded_view: 'overview',

            timeline_view: 'team',

            is_selected: false,
        }
        
        this.getMyPart = this.getMyPart.bind(this)
        this.isVictory = this.isVictory.bind(this)
        this.isLoss = this.isLoss.bind(this)
        this.topBarColor = this.topBarColor.bind(this)
        this.leftTeamChampion = this.leftTeamChampion.bind(this)
        this.rightTeamChampion = this.rightTeamChampion.bind(this)
        this.getTeam100Color = this.getTeam100Color.bind(this)
        this.getTeam200Color = this.getTeam200Color.bind(this)
        this.getTimeline = this.getTimeline.bind(this)
        this.getTotalKills = this.getTotalKills.bind(this)
        this.getKp = this.getKp.bind(this)
        this.getDamagePercentage = this.getDamagePercentage.bind(this)
        this.getTeamMaxKp = this.getTeamMaxKp.bind(this)
        this.getTeamKpPercentage = this.getTeamKpPercentage.bind(this)
        this.getItem = this.getItem.bind(this)
        this.retrieveItem = this.retrieveItem.bind(this)
        this.getCardWidth = this.getCardWidth.bind(this)
        this.toggleExpand = this.toggleExpand.bind(this)
        this.isFullMatchLoaded = this.isFullMatchLoaded.bind(this)
        this.addTeamGoldToTimeline = this.addTeamGoldToTimeline.bind(this)
        this.getMyTeamDataKey = this.getMyTeamDataKey.bind(this)
        this.getOffset = this.getOffset.bind(this)
        this.getDomain = this.getDomain.bind(this)
        this.getEvents = this.getEvents.bind(this)
        this.getBigEvents = this.getBigEvents.bind(this)
        this.sortTimelineEvents = this.sortTimelineEvents.bind(this)
        this.getPart = this.getPart.bind(this)
        this.getEventTeam = this.getEventTeam.bind(this)
        this.isRender = this.isRender.bind(this)
        this.getReferenceEvents = this.getReferenceEvents.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.getNumFromIndex = this.getNumFromIndex.bind(this)
        this.combineTimelineCS = this.combineTimelineCS.bind(this)
    }
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyDown)
    }
    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyDown)
    }
    handleKeyDown(event) {
        if (this.props.store.state.ignore_tags.has(event.target.tagName.toLowerCase())) {
            return
        }
        else {
            var val = parseInt(event.key)
            if (!isNaN(val)) {
                val -= 1
                if (val < 0) {
                    val = 9
                }
                if (val === this.props.index) {
                    if (this.state.is_expanded === false) {
                        this.toggleExpand()
                    }
                    if (this.state.is_selected) {
                        // don't scroll again
                    }
                    else {
                        this.setState({is_selected: true})
                        this.elt.scrollIntoView({behavior: 'smooth', inline: 'start'})
                    }
                }
                else {
                    if (this.state.is_selected) {
                        this.setState({is_selected: false})
                    }
                }
            }
            else {
                if (this.state.is_selected) {
                    var letter = event.key.toLowerCase()
                    if (letter === 'o') {
                        this.setState({expanded_view: 'overview'})
                    }
                    else if (letter === 't') {
                        this.setState({expanded_view: 'timeline'})
                    }
                    else if (letter === 'r') {
                        this.setState({expanded_view: 'runes'})
                    }
                }
            }
        }
    }
    getNumFromIndex() {
        var num = this.props.index
        num += 1
        if (num === 10) {
            num = 0
        }
        return num
    }
    getMyPart() {
        // get my participant
        var match = this.props.match
        var account_id = this.props.pageStore.state.summoner.account_id
        for (var part of match.participants) {
            if (part.account_id === account_id) {
                return part
            }
        }
    }
    isVictory(match) {
        var part = this.getMyPart(match)
        var team_id = part.team_id
        var seconds = match.game_duration
        if (seconds / 60 < 5) {
            return false
        }
        for (var team of match.teams) {
            if (team._id === team_id) {
                if (team.win_str === 'Win') {
                    return true
                }
            }
        }
        return false
    }
    isRender() {
        if (this.elt === undefined) {
            return true
        }
        var card_pos = this.elt.offsetLeft
        var match_list_pos = this.props.pageStore.match_list.scrollLeft

        if ((card_pos - match_list_pos) < 5000 && (match_list_pos - card_pos) < 4000) {
            return true
        }
        return false
    }
    isLoss(match) {
        var part = this.getMyPart()
        var team_id = part.team_id
        var seconds = match.game_duration
        if (seconds / 60 < 5) {
            return false
        }
        for (var team of match.teams) {
            if (team._id === team_id) {
                if (team.win_str === 'Fail') {
                    return true
                }
            }
        }
        return false
    }
    getTimeline(match) {
        var data = {match_id: match._id, region: this.props.region}
        api.match.timeline(data)
            .then((response) => {
                console.log(response)
            })
    }
    topBarColor(match) {
        if (this.isVictory(match)) {
            return this.props.pageStore.state.victory_color
        }
        else if (this.isLoss(match)) {
            return this.props.pageStore.state.loss_color
        }
        else {
            return this.props.pageStore.state.neutral_color
        }
    }
    getTeam100Color(match) {
        var seconds = match.game_duration
        if (seconds / 60 < 5) {
            // remake
        }
        else {
            for (var team of match.teams) {
                if (team._id === 100) {
                    if (team.win_str === 'Win') {
                        return this.props.pageStore.state.victory_color
                    }
                    else if (team.win_str === 'Fail') {
                        return this.props.pageStore.state.loss_color
                    }
                    else {
                        return this.props.pageStore.state.neutral_color
                    }
                }
            }
        }
        return this.props.pageStore.state.neutral_color
    }
    getTeam200Color(match) {
        var seconds = match.game_duration
        if (seconds / 60 < 5) {
            // remake
        }
        else{
            for (var team of match.teams) {
                if (team._id === 200) {
                    if (team.win_str === 'Win') {
                        return this.props.pageStore.state.victory_color
                    }
                    else if (team.win_str === 'Fail') {
                        return this.props.pageStore.state.loss_color
                    }
                    else {
                        return this.props.pageStore.state.neutral_color
                    }
                }
            }
        }
        return this.props.pageStore.state.neutral_color
    }
    getTeam100(match) {
        var participants
        if (this.state.participants !== null) {
            participants = this.state.participants
        }
        else {
            match = this.props.match
            participants = this.props.match.participants
        }
        var parts = []
        for (var part of participants) {
            if (part.team_id === 100) {
                parts.push(part)
            }
        }
        return parts
    }
    getTeam200(match) {
        var participants
        if (this.state.participants !== null) {
            participants = this.state.participants
        }
        else {
            match = this.props.match
            participants = this.props.match.participants
        }
        var parts = []
        for (var part of participants) {
            if (part.team_id === 200) {
                parts.push(part)
            }
        }
        return parts
    }
    leftTeamChampion(part, team_size, match) {
        var full_height = 140
        var partial = Math.round(full_height / team_size)
        var dmg_perc = this.getDamagePercentage(part, match)
        var wid = dmg_perc * .92

        var kp = this.getKp(match, part)
        var kp_perc = this.getTeamKpPercentage(match, part)
        var kp_wid = kp_perc * .92

        if (kp_wid < 0) {
            kp_wid = 0
        }
        if (wid < 0) {
            wid = 0
        }

        var is_me = false
        if (part.account_id === this.props.pageStore.state.summoner.account_id) {
            is_me = true
        }
        return (
            <div style={{height: partial, position: 'relative'}}>
                <div style={{display: 'inline-block'}}>
                    {/* KP PERCENTAGE WIDTH */}
                    <div
                        title={`${numeral(kp).format('0')}% kp`}
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: 4,
                            height: 3,
                            borderRadius: 10,
                            width: `${kp_wid}%`,
                            background: is_me ? '#4b9bcd': '#4b9bcd40'}}>
                    </div>
                    {/* DAMAGE PERCENTAGE */}
                    <div
                        title={`${numeral(part.stats.total_damage_dealt_to_champions).format('0,0')} damage to champions`}
                        style={{
                            position: 'absolute',
                            left:8,
                            top: 18,
                            height: 3,
                            borderRadius: 10,
                            width: `${wid}%`,
                            background: is_me ? '#dc5f5f': '#dc5f5f40'}}>
                    </div>
                    <img
                        style={{height:20, verticalAlign:'bottom', borderRadius:10, position: 'relative'}}
                        src={part.champion.image_url}
                        alt={part.champion.name}
                        title={part.champion.name} />{' '}
                    <span style={{maxWidth: 40, display: 'inline-block'}}>
                        {is_me &&
                            <small style={{fontWeight:'bold'}}>
                                {this.formattedName(part.summoner_name)}
                            </small>
                        }
                        {!is_me &&
                            <small>
                                {part.account_id !== '0' &&
                                    <Link
                                        target='_blank'
                                        title={part.summoner_name}
                                        className={`${this.props.store.state.theme} silent`}
                                        to={`/${this.props.pageStore.props.region}/${part.summoner_name}/`}>
                                        {this.formattedName(part.summoner_name)}
                                    </Link>
                                }
                                {part.account_id === '0' &&
                                    <span title={part.summoner_name}>
                                        {this.formattedName(part.summoner_name)}
                                    </span>
                                }
                            </small>
                        }
                    </span>
                </div>
                <div style={{float: 'right'}}>
                    <small title={this.kda(part)} style={{display: 'inline-block', paddingRight:5}}>
                        {part.stats.kills}/{part.stats.deaths}/{part.stats.assists}
                    </small>
                </div>
            </div>
        )
    }
    rightTeamChampion(part, team_size, match) {
        var full_height = 140
        var partial = Math.round(full_height / team_size)
        var dmg_perc = this.getDamagePercentage(part, match)
        var wid = dmg_perc * .92

        var kp = this.getKp(match, part)
        var kp_perc = this.getTeamKpPercentage(match, part)
        var kp_wid = kp_perc * .92

        if (kp_wid < 0) {
            wid = 0
        }
        if (wid < 0) {
            wid = 0
        }

        var is_me = false
        if (part.account_id === this.props.pageStore.state.summoner.account_id) {
            is_me = true
        }
        return (
            <div style={{height: partial, position: 'relative'}}>

                <small title={this.kda(part)} style={{display: 'inline-block', paddingLeft:5}}>
                    {part.stats.kills}/{part.stats.deaths}/{part.stats.assists}
                </small>
                <div style={{float: 'right', display: 'inline-block'}}>
                    <div
                        title={`${numeral(kp).format('0')}% kp`}
                        style={{
                            title: `${kp}% kp`,
                            position: 'absolute',
                            right: 8,
                            top: 4,
                            height: 3,
                            borderRadius: 10,
                            width: `${kp_wid}%`,
                            background: is_me ? '#4b9bcd': '#4b9bcd40'}}>
                    </div>
                    <div
                        title={`${numeral(part.stats.total_damage_dealt_to_champions).format('0,0')} damage to champions`}
                        style={{
                            position: 'absolute',
                            right:8,
                            top: 18,
                            height: 3,
                            borderRadius: 10,
                            width: `${wid}%`,
                            background: is_me ? '#dc5f5f': '#dc5f5f40'}}>
                    </div>
                    <span style={{maxWidth: 40, display: 'inline-block'}}>
                        {is_me &&
                            <small style={{fontWeight:'bold'}}>
                                {this.formattedName(part.summoner_name)}
                            </small>
                        }
                        {!is_me &&
                            <small>
                                {part.account_id !== '0' &&
                                    <Link
                                        target='_blank'
                                        title={part.summoner_name}
                                        className={`${this.props.store.state.theme} silent`}
                                        to={`/${this.props.pageStore.props.region}/${part.summoner_name}/`}>
                                        {this.formattedName(part.summoner_name)}
                                    </Link>
                                }
                                {part.account_id === '0' &&
                                    <span title={part.summoner_name}>
                                        {this.formattedName(part.summoner_name)}
                                    </span>
                                }
                            </small>
                        }
                    </span>{' '}
                    <img
                        style={{height:20, verticalAlign:'bottom', borderRadius:10, position: 'relative'}}
                        src={part.champion.image_url}
                        alt={part.champion.name}
                        title={part.champion.name} />
                </div>        
            </div>
        )
    }
    getMaxDamage(match) {
        var max = 0
        for (var player of match.participants) {
            if (player.stats.total_damage_dealt_to_champions > max) {
                max = player.stats.total_damage_dealt_to_champions
            }
        }
        return max
    }
    getDamagePercentage(part, match) {
        var perc = part.stats.total_damage_dealt_to_champions / this.getMaxDamage(match) * 100
        perc = Math.round(perc)
        return perc
    }
    getTeamMaxKp(match, team_id) {
        var max = 0
        var kp
        for (var part of match.participants) {
            if (part.team_id === team_id) {
                kp = this.getKp(match, part)
                if (kp > max) {
                    max = kp
                }
            }
        }
        return max
    }
    getTeamKpPercentage(match, part) {
        var kp = this.getKp(match, part)
        var max = this.getTeamMaxKp(match, part.team_id)
        var perc = kp / max * 100
        return perc
    }
    formattedName(name) {
        name = name.trim()
        var length = 5
        if (name.length >= length + 2) {
            return `${name.slice(0, length)}..`
        }
        return name
    }
    item(id, image_url, match) {
        var item = this.retrieveItem(id, match.major, match.minor)
        return (
            <Item.ItemPopover
                style={{
                    display: 'inline-block',
                    height:28, width:28,
                    margin:'0px 2px',
                }}
                item={item}
                tooltip_style={this.props.store.state.tooltip_style}
                pageStore={this}
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
    retrieveItem(item_id, major, minor) {
        // get item from store
        var version = `${major}.${minor}`
        var store = this.props.store
        var item = null
        var items = store.state.items
        if (items[version] !== undefined) {
            if (items[version][item_id] !== undefined) {
                item = items[version][item_id]
            }
        }
        return item
    }
    getItem(item_id, major, minor) {
        // request item info if it isn't in the store
        var version = `${major}.${minor}`
        var store = this.props.store
        var item = null
        var items = store.state.items

        // if the item already exists, set item equal to it
        if (items[version] !== undefined) {
            if (items[version][item_id] !== undefined) {
                item = items[version][item_id]
            }
        }

        // if the item doesn't exists yet, get it
        if (item === null) {
            var data = {
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
    kda(part) {
        var k = part.stats.kills
        var a = part.stats.assists
        var d = part.stats.deaths
        if (d < 1) {
            d = 1
        }
        var kda = (k + a) / d
        kda = Math.round(kda * 100) / 100
        return kda
    }
    matchHighlightColor(match) {
        var out = ''
        // ranked 5v5 solo
        if (match.queue_id === 420) {
            out = 'highlight1'
        }
        // norms draft
        else if (match.queue_id === 400) {
            out = ''
        }
        // ranked 5v5 flex
        else if (match.queue_id === 440) {
            out = 'highlight2'
        }
        // aram
        else if ([100, 450].indexOf(match.queue_id) >= 0) {
            out = 'highlight3'
        }
        else if ([900, 1010].indexOf(match.queue_id) >= 0) {
            out = 'highlight4'
        }
        // 3v3 ranked
        else if ([470].indexOf(match.queue_id) >= 0) {
            out = 'highlight5'
        }
        else if ([850].indexOf(match.queue_id) >= 0) {
            out = 'highlight6'
        }
        return out
    }
    getTeamSize() {
        var match = this.props.match
        var team1 = this.getTeam100(match)
        var team2 = this.getTeam200(match)
        var max = Math.max(team1.length, team2.length)
        return max
    }
    getTotalKills(match) {
        var team100 = this.getTeam100(match)
        var team200 = this.getTeam200(match)

        var kills = {
            100: 0,
            200: 0
        }
        var part
        for (part of team100) {
            kills[100] = kills[100] + part.stats.kills
        }
        for (part of team200) {
            kills[200] = kills[200] + part.stats.kills
        }
        return kills
    }
    getKp(match, part) {
        var team_id = part.team_id
        var total = this.getTotalKills(match)[team_id]
        var kills_and_assists = part.stats.kills + part.stats.assists
        var percentage = 0
        if (total > 0) {
            percentage = (kills_and_assists / total) * 100
        }
        return percentage
    }
    paddedSummaryWidth() {
        return this.state.summary_width-(this.state.card_horizontal_padding * 2)
    }
    getCardWidth() {
        var width = this.state.summary_width
        if (this.state.is_expanded) {
            width = this.state.expanded_width
        }
        return width
    }
    toggleExpand() {
        this.setState({is_expanded: !this.state.is_expanded}, () => {
            if (!this.state.is_attempt_get_full_match) {
                // let's get our full match data
                this.setState({
                        is_loading_full_match: true,
                        is_attempt_get_full_match: true
                    }, () => {
                        api.match.timeline({match_id: this.props.match._id})
                            .then(response => {
                                var timeline = this.addTeamGoldToTimeline(response.data.data)
                                timeline = this.sortTimelineEvents(timeline)
                                timeline = this.combineTimelineCS(timeline)
                                this.setState({timeline: timeline})
                            })
                            .catch(error => {
                                console.error(error)
                            })
                            .then(() => {
                                this.setState({is_loading_full_match: false})
                            })
                    }
                )
            }
            else {

            }
        })
    }
    combineTimelineCS(timeline) {
        for (let i=0; i<timeline.length; i++) {
            for (let j=0; j<timeline[i].participantframes.length; j++) {
                timeline[i].participantframes[j].cs = timeline[i].participantframes[j].jungle_minions_killed + timeline[i].participantframes[j].minions_killed
            }
        }
        return timeline
    }
    sortTimelineEvents(timeline) {
        for (var i=0; i<timeline.length; i++) {
            timeline[i].events = timeline[i].events.sort((a, b) => {return a.timestamp - b.timestamp})
        }
        return timeline
    }
    isFullMatchLoaded() {
        var out = true
        if (this.state.timeline === null) {
            out = false
        }
        return out
    }
    addTeamGoldToTimeline(timeline) {
        var team100 = []
        var team200 = []
        for (var part of this.props.match.participants) {
            if (part.team_id === 100) {
                team100.push(part._id)
            }
            else {
                team200.push(part._id)
            }
        }
        var team100_total
        var team200_total
        for (var frame of timeline) {
            team100_total = 0
            team200_total = 0
            for (var pframe of frame.participantframes) {
                if (pframe.total_gold !== undefined) {
                    if (team100.indexOf(pframe.participant_id) >= 0) {
                        team100_total += pframe.total_gold
                    }
                    else {
                        team200_total += pframe.total_gold
                    }
                }
            }
            frame.team100_gold = team100_total
            frame.team200_gold = team200_total

            frame.team100_adv = frame.team100_gold - frame.team200_gold
            frame.team200_adv = frame.team200_gold - frame.team100_gold

            if (frame.team100_adv >= 0) {
                frame.team100_perc_adv = (frame.team100_adv / team200_total) * 100
                frame.team200_perc_adv = -frame.team100_perc_adv
            }
            else {
                frame.team200_perc_adv = (frame.team200_adv / team100_total) * 100
                frame.team100_perc_adv = -frame.team200_perc_adv
            }
        }
        return timeline
    }
    getMyTeamDataKey(style) {
        var mypart = this.getMyPart()
        var myteam = mypart.team_id
        if (style === 'perc') {
            return `team${myteam}_perc_adv`
        }
        return `team${myteam}_adv`
    }
    getOffset() {
        const dataMax = Math.max(...this.state.timeline.map((i) => i[this.getMyTeamDataKey()]));
        const dataMin = Math.min(...this.state.timeline.map((i) => i[this.getMyTeamDataKey()]));

        if (dataMax <= 0){
            return 0
        }
        else if (dataMin >= 0){
            return 1
        }
        else{
            return dataMax / (dataMax - dataMin);
        }
    }
    getDomain(style) {
        var vals = []
        for (var frame of this.state.timeline) {

            if (style === 'perc') {
                vals.push(Math.abs(frame.team100_perc_adv)) 
            }
            else {
                vals.push(Math.abs(frame.team100_adv))
            }
        }

        var bound = Math.max(...vals)

        if (style === 'perc') {
            bound = (Math.floor(bound / 10) * 10) + 10
        }
        else {
            bound = (Math.floor(bound / 5000) * 5000) + 5000
        }

        return [-bound, bound]
    }
    getEvents(index) {
        var events = []
        if (index !== null) {
            events = this.state.timeline[index].events
        }
        return events
    }
    getBigEvents(index) {
        var events = this.getEvents(index)
        var include_events = new Set([
            'CHAMPION_KILL',
            'BUILDING_KILL',
            'ELITE_MONSTER_KILL',
        ])
        var big_events = []
        for (var event of events) {
            if (include_events.has(event._type)) {
                if (event.killer_id !== 0) {
                    big_events.push(event)
                }
            }
        }
        return big_events
    }
    getReferenceEvents() {
        var reference_lines = []
        var events
        var frame
        for (var i=0; i<this.state.timeline.length; i++) {
            frame = this.state.timeline[i]
            events = this.getBigEvents(i)
            for (var event of events) {
                if (event._type === 'ELITE_MONSTER_KILL') {
                    event.y_val = frame[this.getMyTeamDataKey()]
                    event.frame_timestamp = frame.timestamp
                    reference_lines.push(event)
                }
            }
        }
        return reference_lines
    }
    getEventTeam(event) {
        var team_id = null
        var part
        if (event._type === 'CHAMPION_KILL') {
            part = this.getPart(event.victim_id)
            if (part !== null && part.team_id === 100) {
                team_id = 200
            }
            else {
                team_id = 100
            }
        }
        else if (event._type === 'BUILDING_KILL') {
            if (event.team_id === 100) {
                team_id = 200
            }
            else {
                team_id = 100
            }
        }
        else if (event._type === 'ELITE_MONSTER_KILL') {
            part = this.getPart(event.killer_id)
            team_id = part.team_id
        }
        return team_id
    }
    getPart(participant_id) {
        for (var part of this.props.match.participants) {
            if (part._id === participant_id) {
                return part
            }
        }
        return null
    }
    convertQueue(queue) {
        var convert = {
            'Co-op vs. AI Intermediate Bot':  'Co-op vs Bots Int'
        }
        if (convert[queue] !== undefined) {
            return convert[queue]
        }
        return queue
    }
    render() {
        let mypart = this.getMyPart()
        let match = this.props.match
        let team_size = this.getTeamSize()
        let theme = this.props.store.state.theme
        let big_events = this.getBigEvents(this.state.timeline_index)
        let menu_button_style = {
            display: 'block',
            padding: '0 5px',
            width: '85%',
            marginLeft: '7.5%',
            marginTop: 8,
        }
        let statbox_style = {
            display: 'inline-block',
            padding: '2px 0px',
            width: 100,
            borderRadius: 10,
            marginBottom: 3,
        }
        let game_time = this.props.match.game_duration / 60
        let dpm = mypart.stats.total_damage_dealt_to_champions / (this.props.match.game_duration / 60)
        let vision_score_per_minute = mypart.stats.vision_score / game_time
        let damage_taken_per_minute = mypart.stats.total_damage_taken / game_time
        let csm = (mypart.stats.total_minions_killed + mypart.stats.neutral_minions_killed) / game_time
        var expand_title = ''
        if (this.getNumFromIndex() < 10) {
            expand_title = `Press "${this.getNumFromIndex()}" to quickly navigate to and expand this match card.`
        }
        return (
            <div
                style={{
                    width: this.getCardWidth(),
                    height: this.props.pageStore.state.match_card_height,
                    display: 'inline-block',
                    margin: '0px 10px 10px 10px',
                    paddingTop: 15,
                    paddingRight: this.state.card_horizontal_padding,
                    paddingLeft: this.state.card_horizontal_padding,
                    position: 'relative',
                    verticalAlign: 'bottom',
                    // overflow: 'hidden',
                    transition: 'all .4s ease',
                }}
                ref={(elt) => this.elt = elt}
                className={`card-panel ${this.props.store.state.theme}`}>

                {this.isRender() &&
                    <div>
                        <div style={{display: 'inline-block'}}>
                            <div
                                style={{
                                    width: this.paddedSummaryWidth(),
                                    height:4,
                                    background: `${this.topBarColor(match)}`,
                                    borderRadius: 2,
                                }} >
                            </div>
                            <div
                                style={{
                                    width: this.paddedSummaryWidth(),
                                    background: `${this.topBarColor(match)}1f`,
                                    padding: '0 4px',
                                    display: 'inline-block',
                                    marginLeft: 0,
                                    marginBottom: 0,
                                }}
                                className="row">
                                <div style={{padding:'5px 0px 0px 0px'}} className="col s6">
                                    {this.getTeam100(match).map((part, key) => <div key={`${key}-${part.account_id}`}>{this.leftTeamChampion(part, team_size, match)}</div>)}
                                    
                                    <div
                                        style={{
                                            marginRight: 5,
                                            height:3,
                                            background: `${this.getTeam100Color(match)}`,
                                            borderRadius: '2px'
                                        }} >
                                    </div>
                                </div>
                                <div style={{padding:'5px 0px 0px 0px'}} className="col s6">
                                    {this.getTeam200(match).map((part, key) =>  <div key={`${key}-${part.account_id}`}>{this.rightTeamChampion(part, team_size, match)}</div>)}

                                    <div
                                        style={{
                                            marginLeft: 5,
                                            height:3,
                                            background: `${this.getTeam200Color(match)}`,
                                            borderRadius: '2px'
                                        }} >
                                    </div>
                                </div>
                            </div>
                            <div style={{height: 20, textAlign: 'right'}}>
                                {match.tier_average &&
                                    <small style={{verticalAlign: 'top'}}>Rank Average:{' '}
                                        <div style={{fontWeight: 'bold', display: 'inline-block', verticalAlign: 'inherit'}}>{match.tier_average}</div>
                                    </small>
                                }
                            </div>
                            <div style={{width: this.state.summary_width - 50, marginLeft: -10}}>
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
                                            {this.item(mypart.stats.item_0, mypart.stats.item_0_image_url, match)}
                                        </span>
                                        <span>
                                            {this.item(mypart.stats.item_1, mypart.stats.item_1_image_url, match)}
                                        </span>
                                        <span>
                                            {this.item(mypart.stats.item_2, mypart.stats.item_2_image_url, match)}
                                        </span>
                                    </div>
                                    <div style={{width:100}}>
                                        <span>
                                            {this.item(mypart.stats.item_3, mypart.stats.item_3_image_url, match)}
                                        </span>
                                        <span>
                                            {this.item(mypart.stats.item_4, mypart.stats.item_4_image_url, match)}
                                        </span>
                                        <span>
                                            {this.item(mypart.stats.item_5, mypart.stats.item_5_image_url, match)}
                                        </span>
                                    </div>
                                </span>

                                <div
                                    style={{
                                        display: 'inline-block',
                                        verticalAlign:'top',
                                        width: 76,
                                        textAlign: 'center',
                                    }}>
                                    <span style={{verticalAlign:'top'}}>
                                        <span>
                                            {mypart.stats.kills} / {mypart.stats.deaths} / {mypart.stats.assists}
                                        </span>
                                        <br/>
                                        <small title={'(Kills + Assists) / Deaths'} className={`${this.props.store.state.theme} pill`}>
                                            {numeral(this.kda(mypart)).format('0.00')} kda
                                        </small>
                                        <br/>
                                        <small title='% Kill Participation' className={`${this.props.store.state.theme} pill`}>
                                            {numeral(this.getKp(match, mypart)).format('0')}% kp
                                        </small>
                                    </span>

                                </div>
                            </div>

                            {/*<div style={{display: 'inline-block'}}>
                                <StatPie
                                    width={240}
                                    height={95}
                                    match={match}
                                    store={this.props.store}
                                    mypart={mypart}
                                    pageStore={this.props.pageStore} />
                            </div>*/}

                            <div style={{width: '90%'}}>
                                <div style={{width: '50%', textAlign: 'center', display: 'inline-block'}}>
                                    <div title='CS Per Minute' style={{...statbox_style, backgroundColor: '#65543a'}}>
                                        <div style={{textDecoration: 'underline', fontWeight: 'bold'}}>CS/Min</div>
                                        <div>
                                            {numeral(csm).format('0.0')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{width: '50%', textAlign: 'center', display: 'inline-block'}}>
                                    <div title='Vision Score Per Minute' style={{...statbox_style, backgroundColor: '#276159'}}>
                                        <div style={{textDecoration: 'underline', fontWeight: 'bold'}}>VS/Min</div>
                                        <div>
                                            {numeral(vision_score_per_minute).format('0.00')}
                                        </div>
                                    </div>
                                </div>
                                <br/>
                                <div style={{width: '50%', textAlign: 'center', display: 'inline-block'}}>
                                    <div title='Damage Per Minute' style={{...statbox_style, backgroundColor: '#56262a'}}>
                                        <div style={{textDecoration: 'underline', fontWeight: 'bold'}}>DPM</div>
                                        <div>
                                            {numeral(dpm).format('0,0')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{width: '50%', textAlign: 'center', display: 'inline-block'}}>
                                    <div title='Damage Taken Per Minute' style={{...statbox_style, backgroundColor: '#1f1f1f'}}>
                                        <div style={{textDecoration: 'underline', fontWeight: 'bold'}}>DT/Min</div>
                                        <div>
                                            {numeral(damage_taken_per_minute).format('0,0')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{position:'absolute', left: this.state.summary_width - 26, top:190, zIndex:10}}>
                                <button
                                    title={expand_title}
                                    onClick={this.toggleExpand}
                                    className={`${this.props.store.state.theme} btn-small`} style={{height:209, padding:'0 3px'}}>
                                    {!this.state.is_expanded &&
                                        <i className="material-icons">chevron_right</i>
                                    }
                                    {this.state.is_expanded &&
                                        <i className="material-icons">chevron_left</i>
                                    }
                                </button>
                            </div>

                            {/* match card footer */}
                            <div style={{position:'absolute', bottom:5, left:0}}>
                                <div style={{float:'left', paddingLeft:10}}>
                                    <small style={{lineHeight:1, display:'block'}}>
                                        {`${Math.floor(match.game_duration / 60)}:${numeral(match.game_duration % 60).format('00')}`}
                                    </small>
                                    <small title={formatDatetimeFull(match.game_creation)} style={{lineHeight:1}}>
                                        {formatDatetime(match.game_creation)}
                                    </small>
                                </div>

                                <div style={{position:'absolute', bottom:0, left: this.state.summary_width - 180, width:150, textAlign: 'right'}}>
                                    <small className={`${this.props.store.state.theme} ${this.matchHighlightColor(match)}`}>
                                        {this.props.pageStore.state.queues[match.queue_id] &&
                                            <>
                                            {this.convertQueue(this.props.pageStore.state.queues[match.queue_id].description)}
                                            </>
                                        }
                                        {this.props.pageStore.state.queues[match.queue_id] === undefined &&
                                            <>
                                            {match.queue_id}
                                            </>
                                        }
                                    </small>
                                </div>
                            </div>
                        </div>


                        <div
                            style={{
                                display: 'inline-block',
                                verticalAlign: 'top',
                                paddingLeft: 20,
                            }}>

                            {/* MENU BUTTONS */}
                            {this.state.is_expanded &&
                                <div style={{
                                    position: 'absolute',
                                    top: 10,
                                    width: 25,
                                    height: 180,
                                    left: this.state.summary_width + 2,
                                    textAlign: 'center',
                                    borderColor: 'grey',
                                    borderStyle: 'solid',
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    }}>

                                    <ReactTooltip
                                        id='overview-button-tt'
                                        effect='solid' >
                                        <span>
                                            Overview
                                        </span>
                                    </ReactTooltip>
                                    <button
                                        data-tip
                                        data-for='overview-button-tt'
                                        title='Overview'
                                        style={menu_button_style}
                                        className={`dark btn-small ${this.state.expanded_view === 'overview' ? 'selected': ''}`}
                                        onClick={() => this.setState({expanded_view: 'overview'})}>
                                        o
                                    </button>
                                    
                                    <ReactTooltip
                                        id='timeline-button-tt'
                                        effect='solid' >
                                        <span>
                                            Team/Champion Timelines
                                        </span>
                                    </ReactTooltip>
                                    <button
                                        data-tip
                                        data-for='timeline-button-tt'
                                        title='Timeline'
                                        style={menu_button_style}
                                        className={`dark btn-small ${this.state.expanded_view === 'timeline' ? 'selected': ''}`}
                                        onClick={() => this.setState({expanded_view: 'timeline'})} >
                                        t
                                    </button>

                                    <ReactTooltip
                                        id='runes-button-tt'
                                        effect='solid' >
                                        <span>
                                            Runes
                                        </span>
                                    </ReactTooltip>
                                    <button
                                        data-tip
                                        data-for='runes-button-tt'
                                        title='Runes'
                                        style={menu_button_style}
                                        className={`dark btn-small ${this.state.expanded_view === 'runes' ? 'selected': ''}`}
                                        onClick={() => this.setState({expanded_view: 'runes'})} >
                                        r
                                    </button>
                                </div>
                            }

                            
                            {this.state.is_expanded && this.state.expanded_view === 'timeline' &&
                                <span>

                                    {/* TIMELINE BUTTONS */} 
                                    <div style={{
                                        position: 'absolute',
                                        top: 230,
                                        width: 25,
                                        height: 145,
                                        left: this.state.summary_width + 2,
                                        textAlign: 'center',
                                        borderColor: 'grey',
                                        borderStyle: 'solid',
                                        borderWidth: 1,
                                        borderRadius: 5,
                                        }}>
                                        <button
                                            style={{...menu_button_style, height: 50}}
                                            className={`dark btn-small ${this.state.timeline_view === 'team' ? 'selected': ''}`}
                                            onClick={() => this.setState({timeline_view: 'team'})}>
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    transform: 'rotate(-90deg) translate(0px, 20px)',
                                                    transformOrigin: 'bottom left 0',
                                                    verticalAlign: 'text-top'}} >
                                                team
                                            </div>
                                        </button>
                                        
                                        <button
                                            style={{...menu_button_style, height: 65}}
                                            className={`dark btn-small ${this.state.timeline_view === 'champ' ? 'selected': ''}`}
                                            onClick={() => this.setState({timeline_view: 'champ'})} >
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    transform: 'rotate(-90deg) translate(0px, 20px)',
                                                    transformOrigin: 'bottom left 0',
                                                    verticalAlign: 'text-top'}}>
                                                    champ
                                            </div>
                                        </button>
                                    </div>

                                    {this.state.is_loading_full_match &&
                                        <div style={{marginLeft: 110, marginTop: 80}}>
                                            <AtomSpinner
                                                color='#1f1f1f'
                                                size={200} />
                                        </div>
                                    }

                                    {!this.state.is_loading_full_match && this.isFullMatchLoaded() &&
                                        <div>
                                            {this.state.timeline_view === 'team' &&

                                                <div>
                                                    <div style={{marginLeft: 30}}>
                                                        <ComposedChart
                                                            width={370}
                                                            height={125}
                                                            data={this.state.timeline}
                                                            margin={{
                                                              top: 10, right: 15, left: -5, bottom: 0,
                                                            }}
                                                            onMouseMove={(props) => {
                                                                if (props.activeTooltipIndex !== undefined) {
                                                                    var timeline_index = props.activeTooltipIndex
                                                                    this.setState({timeline_index: timeline_index})
                                                                }
                                                            }}
                                                            onMouseOut={() => this.setState({timeline_index: null})} >
                                                            <CartesianGrid
                                                                vertical={false}
                                                                stroke='#777'
                                                                strokeDasharray="4 4" />
                                                            <XAxis
                                                                hide={true}
                                                                tickFormatter={(tickItem) => {
                                                                    var m = Math.round(tickItem / 1000 / 60)
                                                                    return `${m}m`
                                                                }}
                                                                dataKey="timestamp" />
                                                            
                                                            <YAxis
                                                                // domain={this.getDomain()}
                                                                yAxisId='left'
                                                                orientation='left'
                                                                tickFormatter={(tick) => {
                                                                    return numeral(tick).format('0.0a')
                                                                }} />
                                                            
                                                            <Tooltip
                                                                offset={70}
                                                                formatter={(value, name, props) => {
                                                                    if (name.indexOf('perc') >= 0) {
                                                                        value = numeral(value).format('0')
                                                                        return [`${value}%`, '% Gold Adv.']
                                                                    }
                                                                    else {
                                                                        value = numeral(value).format('0,0')
                                                                        return [`${value}g`, 'Gold Adv.']
                                                                    }
                                                                }}
                                                                labelFormatter={(label) => {
                                                                    var m = Math.round(label / 1000 / 60)
                                                                    return `${m}m`
                                                                }} />
                                                            <defs>
                                                                <linearGradient id={`${this.props.match._id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset={this.getOffset()} stopColor="#3674ad" stopOpacity={1} />
                                                                    <stop offset={this.getOffset()} stopColor="#cd565a" stopOpacity={1} />
                                                                </linearGradient>
                                                            </defs>

                                                            <Area
                                                                yAxisId='left'
                                                                type="monotone"
                                                                dataKey={this.getMyTeamDataKey()}
                                                                stroke="#000"
                                                                fill={`url(#${this.props.match._id}-gradient)`} />

                                                            {this.getReferenceEvents().map(event => {
                                                                var color = '#3674ad'
                                                                if (this.getEventTeam(event) !== mypart.team_id) {
                                                                    color = '#cd565a'
                                                                }
                                                                var stroke_width = 1
                                                                if (event.monster_type === 'BARON_NASHOR') {
                                                                    stroke_width = 3
                                                                }
                                                                else if (event.monster_sub_type === 'ELDER_DRAGON') {
                                                                    stroke_width = 3
                                                                }
                                                                return (
                                                                    <ReferenceLine
                                                                        yAxisId='left'
                                                                        key={`${this.props.match._id}-${event.timestamp}`}
                                                                        x={event.frame_timestamp}
                                                                        stroke={color}
                                                                        strokeWidth={stroke_width} />
                                                                )
                                                            })}

                                                            {/* secondary chart */}
                                                            {/*
                                                                <YAxis
                                                                    domain={this.getDomain('perc')}
                                                                    tickFormatter={(tick) => {
                                                                        var perc = numeral(tick).format('0')
                                                                        return `${perc}%`
                                                                    }}
                                                                    yAxisId="right" orientation='right' tickLine={false} axisLine={false}/>
                                                                <Area
                                                                    opacity='0.3'
                                                                    yAxisId='right'
                                                                    type="monotone"
                                                                    dataKey={this.getMyTeamDataKey('perc')}
                                                                    stroke="#777" fill={`#fff`} />
                                                            */}

                                                        </ComposedChart>
                                                    </div>

                                                    {/* EVENTS */}
                                                    <div style={{
                                                        margin: '10px 10px 10px 30px',
                                                        borderStyle: 'solid',
                                                        borderWidth: 1,
                                                        borderRadius: 5,
                                                        borderColor: 'gray',
                                                        height: 240,
                                                        overflowY: 'hidden',
                                                        }} >
                                                        {big_events.length === 0 &&
                                                            <div style={{textAlign: 'center', paddingTop: 20}}>
                                                                No events
                                                            </div>
                                                        }
                                                        {big_events.map((event, key) => {
                                                            var some_style = {
                                                                width: '50%'
                                                            }
                                                            var is_right = false
                                                            if (this.getEventTeam(event) === 100) {

                                                            }
                                                            else {
                                                                is_right = true
                                                            }

                                                            let part1 = this.getPart(event.killer_id)
                                                            let part2 = this.getPart(event.victim_id)

                                                            var is_me = false
                                                            if ((part1 !== null && part1._id === mypart._id) ||
                                                                (part2 !== null && part2._id === mypart._id)) {
                                                                is_me = true
                                                            }
                                                            var is_me_style = {}
                                                            if (is_me) {
                                                                is_me_style = {
                                                                    background: '#323042',
                                                                    borderRadius: 5,
                                                                }
                                                            }
                                                            return (
                                                                <div style={{height:20, ...is_me_style}} key={`${this.props.match._id}-event-${key}`}>
                                                                    {is_right &&
                                                                        <div style={{width:'50%', display: 'inline-block'}}></div>
                                                                    }
                                                                    <small style={{...some_style, display: 'inline-block', verticalAlign: 'middle'}}>
                                                                        <div style={{width:35, verticalAlign: 'top', display: 'inline-block', marginLeft: 5}} className={`${this.props.store.state.theme} muted`}>
                                                                            {Math.floor(event.timestamp / 1000 / 60)}:{numeral((event.timestamp / 1000) % 60).format('00')}
                                                                        </div>{' '}
                                                                        
                                                                        <span style={{verticalAlign: 'top'}}>
                                                                            {event._type === 'CHAMPION_KILL' &&
                                                                                <span>
                                                                                    <span>
                                                                                        {part1 !== null &&
                                                                                            <img style={{height:15}} src={part1.champion.image_url} alt=""/>
                                                                                        }
                                                                                        {part1 === null &&
                                                                                            <span>minions</span>
                                                                                        }
                                                                                    </span>{' '}
                                                                                    <span>
                                                                                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>killed</span>
                                                                                    </span>{' '}
                                                                                    <span>
                                                                                        <img style={{height:15}} src={part2.champion.image_url} alt=""/>
                                                                                    </span>
                                                                                </span>
                                                                            }

                                                                            {event._type === 'BUILDING_KILL' &&
                                                                                <span>
                                                                                    <span>
                                                                                        {part1 !== null &&
                                                                                            <img style={{height:15}} src={part1.champion.image_url} alt=""/>
                                                                                        }
                                                                                        {part1 === null &&
                                                                                            <span>minions</span>
                                                                                        }
                                                                                    </span>{' '}
                                                                                    <span>
                                                                                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>destroyed</span>
                                                                                    </span>{' '}

                                                                                    <span style={{verticalAlign: 'text-bottom'}}>
                                                                                        {event.building_type === 'TOWER_BUILDING' &&
                                                                                            <span>tower</span>
                                                                                        }
                                                                                        {event.building_type === 'INHIBITOR_BUILDING' &&
                                                                                            <span>inhib</span>
                                                                                        }
                                                                                        {['TOWER_BUILDING', 'INHIBITOR_BUILDING'].indexOf(event.building_type) === -1 &&
                                                                                            <span>structure</span>
                                                                                        }
                                                                                    </span>
                                                                                </span>
                                                                            }

                                                                            {event._type === 'ELITE_MONSTER_KILL' &&
                                                                                <span>
                                                                                    <span>
                                                                                        {part1 !== null &&
                                                                                            <img style={{height:15}} src={part1.champion.image_url} alt=""/>
                                                                                        }
                                                                                        {part1 === null &&
                                                                                            <span>minions</span>
                                                                                        }
                                                                                    </span>{' '}
                                                                                    <span>
                                                                                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>killed</span>
                                                                                    </span>{' '}
                                                                                    <span style={{verticalAlign: 'text-bottom'}}>
                                                                                        {function(event) {
                                                                                            if (event.monster_type === 'DRAGON') {
                                                                                                if (event.monster_sub_type === 'EARTH_DRAGON') {
                                                                                                    return <span>earth</span>
                                                                                                }
                                                                                                else if (event.monster_sub_type === 'WATER_DRAGON') {
                                                                                                    return <span>water</span>
                                                                                                }
                                                                                                else if (event.monster_sub_type === 'FIRE_DRAGON') {
                                                                                                    return <span>fire</span>
                                                                                                }
                                                                                                else if (event.monster_sub_type === 'AIR_DRAGON') {
                                                                                                    return <span>cloud</span>
                                                                                                }
                                                                                                else if (event.monster_sub_type === 'ELDER_DRAGON') {
                                                                                                    return <span>elder</span>
                                                                                                }
                                                                                                else {
                                                                                                    return <span>{event.monster_sub_type}</span>
                                                                                                }
                                                                                            }
                                                                                            else if (event.monster_type === 'BARON_NASHOR') {
                                                                                                return <span>purple snek</span>
                                                                                            }
                                                                                            else if (event.monster_type === 'RIFTHERALD') {
                                                                                                return <span>big scuttle</span>
                                                                                            }
                                                                                            else {
                                                                                                return <span>{event.monster_type} {event.monster_sub_type}</span>
                                                                                            }
                                                                                        }.bind(this, event)()}
                                                                                    </span>
                                                                                </span>
                                                                            }
                                                                        </span>

                                                                    </small>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            }

                                            {this.state.timeline_view === 'champ' &&
                                                <div style={{marginLeft: 30}}>
                                                    <ChampionTimelines
                                                        theme={theme}
                                                        my_part={this.getMyPart()}
                                                        summoner={this.props.pageStore.state.summoner}
                                                        participants={this.state.participants}
                                                        timeline={this.state.timeline}
                                                        expanded_width={this.state.expanded_width - this.state.summary_width} />
                                                </div>
                                            }

                                        </div>

                                        
                                    }
                                </span>
                            } {/* END TIMELINE VIEW */}

                            {this.state.is_expanded && this.state.expanded_view === 'overview' &&
                                <div style={{marginLeft: 30}}>
                                    <div>
                                        <StatOverview store={this.props.store} pageStore={this.props.pageStore} parent={this} is_expanded={this.state.is_expanded} />
                                    </div>
                                </div>
                            }

                            {this.state.is_expanded && this.state.expanded_view === 'runes' &&
                                <div>
                                    <div>
                                        <RunePage store={this.props.store} pageStore={this.props.pageStore} parent={this} />
                                    </div>
                                </div>
                            }

                        </div>
                        
                    </div>
                }
                

            </div>
        )
    }
}
MatchCard.propTypes = {
    match: PropTypes.object,
    mypart: PropTypes.object,
    store: PropTypes.object,
    pageStore: PropTypes.object,
}

export default MatchCard