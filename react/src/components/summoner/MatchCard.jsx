import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import api from '../../api/api'
import numeral from 'numeral'
import moment from 'moment'
import Item from '../data/Item'


function formatDatetime(epoch) {
    return moment(epoch).format('MMM DD h:mm a')
}


class MatchCard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            summary_width: 300,
            expanded_width: 700,

            is_expanded: false,

            card_horizontal_padding: 18, 
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
        for (var team of match.teams) {
            if (team._id === team_id) {
                if (team.win_str === 'Win') {
                    return true
                }
            }
        }
        return false
    }
    isLoss(match) {
        var part = this.getMyPart()
        var team_id = part.team_id
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
        return this.props.pageStore.state.neutral_color
    }
    getTeam200Color(match) {
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
        return this.props.pageStore.state.neutral_color
    }
    getTeam100(match) {
        var parts = []
        for (var part of match.participants) {
            if (part.team_id === 100) {
                parts.push(part)
            }
        }
        return parts
    }
    getTeam200(match) {
        var parts = []
        for (var part of match.participants) {
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
                <div style={{
                    position: 'absolute',
                    left:8,
                    top: 19,
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
                <span>
                    {is_me &&
                        <small style={{fontWeight:'bold'}}>
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                    {!is_me &&
                        <small>
                            <Link className={`${this.props.store.state.theme} silent`} to={`/${this.props.pageStore.props.region}/${part.summoner_name}/`}>
                                {this.formattedName(part.summoner_name)}
                            </Link>
                        </small>
                    }
                </span>
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
            <div style={{textAlign: 'right', height: partial, position: 'relative'}}>
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
                <div style={{
                    position: 'absolute',
                    right:8,
                    top: 19,
                    height: 3,
                    borderRadius: 10,
                    width: `${wid}%`,
                    background: is_me ? '#dc5f5f': '#dc5f5f40'}}>
                </div>
                <span>
                    {is_me &&
                        <small style={{fontWeight:'bold'}}>
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                    {!is_me &&
                        <small>
                            <Link className={`${this.props.store.state.theme} silent`} to={`/${this.props.pageStore.props.region}/${part.summoner_name}/`}>
                                {this.formattedName(part.summoner_name)}
                            </Link>
                        </small>
                    }
                </span>{' '}
                <img
                    style={{height:20, verticalAlign:'bottom', borderRadius:10, position: 'relative'}}
                    src={part.champion.image_url}
                    alt={part.champion.name}
                    title={part.champion.name} />
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
        if (name.length >= 14) {
            return `${name.slice(0, 11)}...`
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
    render() {
        let mypart = this.getMyPart()
        let match = this.props.match
        let team_size = this.getTeamSize()
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
                    verticalAlign: 'bottom'
                }}
                className={`card-panel ${this.props.store.state.theme}`}>

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
                    <div>
                        <div style={{display: 'inline-block', paddingRight:5}}>
                            <div>
                                <img
                                    style={{height: 40, display:'inline'}}
                                    src={mypart.champion.image_url}
                                    alt=""/>
                                <div style={{display:'inline-block', paddingLeft:4}}>
                                    <img
                                        style={{height:20, display:'block'}}
                                        src={mypart.spell_1_image_url} alt=""/>
                                    <img
                                        style={{height:20, display:'block'}}
                                        src={mypart.spell_2_image_url} alt=""/>
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
                                width: 90,
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

                    <div>
                        <div>perk_0_var_1 : {mypart.stats.perk_0_var_1}</div>
                        <div>perk_0_var_2 : {mypart.stats.perk_0_var_2}</div>
                        <div>perk_0_var_3 : {mypart.stats.perk_0_var_3}</div>
                    </div>

                    {/* match card footer */}
                    <div style={{position:'absolute', bottom:5, left:0, right:0}}>
                        <div style={{float:'left', paddingLeft:10}}>
                            <small>
                                {`${Math.floor(match.game_duration / 60)}m ${match.game_duration % 60}s`}
                            </small>
                            <br/>
                            <small>
                                {formatDatetime(match.game_creation)}
                            </small>
                        </div>

                        <div style={{position:'absolute', bottom:0, right:0, paddingRight:10}}>
                            <small className={`${this.props.store.state.theme} ${this.matchHighlightColor(match)}`}>
                                {this.props.pageStore.state.queues[match.queue_id].description}
                            </small>
                        </div>
                    </div>
                </div>

                {this.state.is_expanded &&
                    <div
                        style={{
                            display: 'inline-block',
                            verticalAlign: 'top',
                        }}>
                        HELLO NEW DIV
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