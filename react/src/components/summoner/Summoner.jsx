import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'
import numeral from 'numeral'
import moment from 'moment'

import api from '../../api/api'


function formatDatetime(epoch) {
    return moment(epoch).format('MMM DD h:mm a')
}

function convertVerticalScroll(event)  {
    var elt = event.currentTarget
    var delta = (Math.abs(event.deltaX) < Math.abs(event.deltaY) ? event.deltaY : event.deltaX)
    
    if (delta < 0) {
        if (elt.scrollLeft === 0) {
            // comment out to revert to vertical scroll when we hit the left edge
            elt.scrollLeft += delta
            event.preventDefault()
        }
        else {
            elt.scrollLeft += delta
            event.preventDefault()
        }
    }
    else {
        if ((elt.scrollLeft + elt.clientWidth) === elt.scrollWidth) {
            // comment out to revert to vertical scroll when we hit the right edge
            elt.scrollLeft += delta
            event.preventDefault()
        }
        else {
            elt.scrollLeft += delta
            event.preventDefault()
        }
    }
}


class Summoner extends Component {
    constructor(props) {
        super(props)

        this.state = {
            summoner: {},
            icon: {},
            matches: [],
            match_ids: new Set(),
            count: 10,
            next_page: 2,

            is_requesting_page: false,
            is_requesting_next_page: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',

            positions: [],
        }

        this.getSummonerPage = this.getSummonerPage.bind(this)
        this.getMyPart = this.getMyPart.bind(this)
        this.isVictory = this.isVictory.bind(this)
        this.isLoss = this.isLoss.bind(this)
        this.topBarColor = this.topBarColor.bind(this)
        this.leftTeamChampion = this.leftTeamChampion.bind(this)
        this.rightTeamChampion = this.rightTeamChampion.bind(this)
        this.getTeam100Color = this.getTeam100Color.bind(this)
        this.getTeam200Color = this.getTeam200Color.bind(this)
        this.getTimeline = this.getTimeline.bind(this)
        this.getNextPage = this.getNextPage.bind(this)
        this.setQueueDict = this.setQueueDict.bind(this)
        this.getPositions = this.getPositions.bind(this)
        this.setDefaults = this.setDefaults.bind(this)
    }
    componentDidMount() {
        this.getSummonerPage(this.getPositions)
        this.setQueueDict()
    }
    componentDidUpdate(prevProps) {
        // new summoner
        if (this.props.route.match.params.summoner_name !== prevProps.route.match.params.summoner_name) {
            this.setDefaults(() => {
                this.getSummonerPage(this.getPositions)
            })
        }
    }
    setDefaults(callback) {
        var defaults = {
            summoner: {},
            icon: {},
            matches: [],
            match_ids: new Set(),
            count: 10,
            next_page: 2,
            is_requesting_page: false,
            is_requesting_next_page: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',

            positions: [],
        }
        this.setState(defaults, () => {
            if (callback !== undefined) {
                callback()
            }
        })
    }
    getSummonerPage(callback) {
        this.setState({is_requesting_page: true})
        var data = {
            summoner_name: this.props.route.match.params.summoner_name,
            region: this.props.region,
            update: true,
            count: this.state.count,
            trigger_import: true,
        }
        api.player.getSummonerPage(data)
            .then((response) => {
                this.setState({
                    summoner: response.data.summoner,
                    region: this.props.region,
                    icon: response.data.profile_icon,
                    matches: response.data.matches,
                    match_ids: new Set(response.data.matches.map(x => x.id)),
                    is_requesting_page: false,
                }, () => {
                    if (callback !== undefined) {
                        callback()
                    }
                })
            })
            .catch((error) => {
                window.alert('No summoner with that name was found.')
                this.setState({is_requesting_page: false})
            })
    }
    getNextPage() {
        this.setState({is_requesting_next_page: true})
        var data = {
            summoner_name: this.props.route.match.params.summoner_name,
            region: this.props.region,
            update: false,
            count: this.state.count,
            page: this.state.next_page,
            trigger_import: true,
            after_index: this.state.matches.length,
        }
        api.player.getSummonerPage(data)
            .then((response) => {
                var new_matches = []
                var new_match_ids = this.state.match_ids
                for (var m of response.data.matches) {
                    if (new_match_ids.has(m.id)) {
                        // ignore
                    }
                    else {
                        new_match_ids.add(m.id)
                        new_matches.push(m)
                    }
                }
                this.setState({
                    summoner: response.data.summoner,
                    region: this.props.region,
                    icon: response.data.profile_icon,
                    matches: [...this.state.matches, ...new_matches],
                    next_page: this.state.next_page + 1,
                    is_requesting_next_page: false,
                })
            })
    }
    getPositions() {
        var data = {
            summoner_id: this.state.summoner._id,
            region: this.props.region,
        }
        api.player.getPositions(data)
            .then(response => this.setState({positions: response.data.data}))
            .catch(error => {})
    }
    setQueueDict() {
        var queue_elt = document.getElementById('queues')
        var queues = JSON.parse(queue_elt.innerHTML)
        var qdict = {}
        for (var q of queues) {
            q.description = q.description.replace('games', '').trim()
            qdict[q._id] = q
        }
        this.setState({queues: qdict})
    }
    getMyPart(match) {
        // get my participant
        var account_id = this.state.summoner.account_id
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
        var part = this.getMyPart(match)
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
            return this.state.victory_color
        }
        else if (this.isLoss(match)) {
            return this.state.loss_color
        }
        else {
            return this.state.neutral_color
        }
    }
    getTeam100Color(match) {
        for (var team of match.teams) {
            if (team._id === 100) {
                if (team.win_str === 'Win') {
                    return this.state.victory_color
                }
                else if (team.win_str === 'Fail') {
                    return this.state.loss_color
                }
                else {
                    return this.state.neutral_color
                }
            }
        }
        return this.state.neutral_color
    }
    getTeam200Color(match) {
        for (var team of match.teams) {
            if (team._id === 200) {
                if (team.win_str === 'Win') {
                    return this.state.victory_color
                }
                else if (team.win_str === 'Fail') {
                    return this.state.loss_color
                }
                else {
                    return this.state.neutral_color
                }
            }
        }
        return this.state.neutral_color
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
    leftTeamChampion(part, team_size) {
        var full_height = 140
        var partial = Math.round(full_height / team_size)
        return (
            <div style={{height: partial}}>
                <img
                    style={{height:20, verticalAlign:'bottom', borderRadius:10}}
                    src={part.champion.image_url}
                    alt={part.champion.name}
                    title={part.champion.name} />{' '}
                <span>
                    {part.account_id === this.state.summoner.account_id &&
                        <small style={{fontWeight:'bold'}}>
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                    {part.account_id !== this.state.summoner.account_id &&
                        <small>
                            <Link className={`${this.props.store.state.theme} silent`} to={`/${this.props.region}/${part.summoner_name}/`}>
                                {this.formattedName(part.summoner_name)}
                            </Link>
                        </small>
                    }
                </span>
            </div>
        )
    }
    rightTeamChampion(part, team_size) {
        var full_height = 140
        var partial = Math.round(full_height / team_size)
        return (
            <div style={{textAlign: 'right', height: partial}}>
                <span>
                    {part.account_id === this.state.summoner.account_id &&
                        <small style={{fontWeight:'bold'}}>
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                    {part.account_id !== this.state.summoner.account_id &&
                        <small>
                            <Link className={`${this.props.store.state.theme} silent`} to={`/${this.props.region}/${part.summoner_name}/`}>
                                {this.formattedName(part.summoner_name)}
                            </Link>
                        </small>
                    }
                </span>{' '}
                <img
                    style={{height:20, verticalAlign:'bottom', borderRadius:10}}
                    src={part.champion.image_url}
                    alt={part.champion.name}
                    title={part.champion.name} />
            </div>
        )
    }
    formattedName(name) {
        if (name.length >= 14) {
            return `${name.slice(0, 11)}...`
        }
        return name
    }
    item(id, image_url) {
        return (
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
        )
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
    getTeamSize(match) {
        var team1 = this.getTeam100(match)
        var team2 = this.getTeam200(match)
        var max = Math.max(team1.length, team2.length)
        return max
    }
    render() {
        return (
            <div>
                <NavBar store={this.props.store} />
                {this.state.is_requesting_page &&
                    <div>
                        <div className="row">
                            <div className="col m3">
                                <div className={`card-panel ${this.props.store.state.theme}`}>
                                    <div style={{textAlign:'center'}}>
                                        LOADING DATA...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {!this.state.is_requesting_page &&
                    <div>
                        <div style={{width:400, marginLeft:10, display:'inline-block'}}>
                            {this.state.summoner.name !== undefined &&
                                <SummonerCard positions={this.state.positions} icon={this.state.icon} summoner={this.state.summoner} store={this.props.store} pageStore={this} />
                            }
                        </div>
                        
                        <div style={{display:'inline-block', verticalAlign:'top'}}>
                            <RecentlyPlayedWith
                                matches={this.state.matches}
                                store={this.props.store}
                                pageStore={this}
                                summoner={this.state.summoner} />
                        </div>

                        <div>
                            <div
                                className="horizontal-scroll quiet-scroll"
                                onWheel={convertVerticalScroll} >
                                
                                {/* MATCH CARD */}
                                {this.state.matches.map((match, key) => {
                                    let mypart = this.getMyPart(match)
                                    var team_size = this.getTeamSize(match)
                                    return (
                                        <div
                                            key={`${key}-${match._id}`}
                                            style={{
                                                width:300,
                                                height:500,
                                                display:'inline-block',
                                                margin:'0px 10px 10px 10px',
                                                paddingTop:15,
                                                position:'relative',
                                                verticalAlign: 'bottom'
                                            }}
                                            className={`card-panel ${this.props.store.state.theme}`}>
                                            <div
                                                style={{
                                                    height:4,
                                                    background: `${this.topBarColor(match)}`,
                                                    borderRadius: 2,
                                                }} >
                                            </div>
                                            <div
                                                style={{
                                                    background: `${this.topBarColor(match)}1f`,
                                                    padding: '0 4px',
                                                }}
                                                className="row">
                                                <div style={{padding:'10px 0px 0px 0px'}} className="col s6">
                                                    {this.getTeam100(match).map((part, key) => <div key={`${key}-${part.account_id}`}>{this.leftTeamChampion(part, team_size)}</div>)}
                                                    
                                                    <div
                                                        style={{
                                                            marginRight: 5,
                                                            height:3,
                                                            background: `${this.getTeam100Color(match)}`,
                                                            borderRadius: '2px'
                                                        }} >
                                                    </div>
                                                </div>
                                                <div style={{padding:'10px 0px 0px 0px'}} className="col s6">
                                                    {this.getTeam200(match).map((part, key) =>  <div key={`${key}-${part.account_id}`}>{this.rightTeamChampion(part, team_size)}</div>)}

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
                                                        style={{height:20, verticalAlign:'top'}}
                                                        src={mypart.stats.perk_0_image_url}
                                                        alt=""/>
                                                    <img
                                                        style={{height:20, verticalAlign:'top'}}
                                                        src={mypart.stats.perk_sub_style_image_url}
                                                        alt=""/>
                                                </div>

                                                <span style={{display: 'inline-block'}}>
                                                    <div style={{width:100}}>
                                                        <span>
                                                            {this.item(mypart.stats.item_0, mypart.stats.item_0_image_url)}
                                                        </span>
                                                        <span>
                                                            {this.item(mypart.stats.item_1, mypart.stats.item_1_image_url)}
                                                        </span>
                                                        <span>
                                                            {this.item(mypart.stats.item_2, mypart.stats.item_2_image_url)}
                                                        </span>
                                                    </div>
                                                    <div style={{width:100}}>
                                                        <span>
                                                            {this.item(mypart.stats.item_3, mypart.stats.item_3_image_url)}
                                                        </span>
                                                        <span>
                                                            {this.item(mypart.stats.item_4, mypart.stats.item_4_image_url)}
                                                        </span>
                                                        <span>
                                                            {this.item(mypart.stats.item_5, mypart.stats.item_5_image_url)}
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
                                                        <span>
                                                            {numeral(this.kda(mypart)).format('0.00')} kda
                                                        </span>
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
                                                        {this.state.queues[match.queue_id].description}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                <div
                                    style={{
                                        width:100, height:500,
                                        display: 'inline-block',
                                        margin: '0px 10px 10px 10px',
                                        paddingTop:15,
                                        verticalAlign: 'top',
                                        cursor: 'pointer',
                                        position: 'relative',
                                    }}
                                    onClick={this.getNextPage}
                                    className={`card-panel ${this.props.store.state.theme}`}>
                                    <div style={{height: '100%', paddingTop: 100, textAlign: 'center'}}>
                                        {this.state.is_requesting_next_page &&
                                            <span>Loading...</span>
                                        }
                                        {!this.state.is_requesting_next_page &&
                                            <span style={{fontWeight:'bold', textDecoration:'underline'}}>More</span>
                                        }
                                    </div>
                                </div>

                                <div style={{display: 'inline-block', width: 200}}></div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}


class SummonerCard extends Component {
    constructor(props) {
        super(props)

        this.state = {}

        this.positionalRankImage = this.positionalRankImage.bind(this)
        this.generalRankImage = this.generalRankImage.bind(this)
        this.soloPositions = this.soloPositions.bind(this)
        this.miniSeries = this.miniSeries.bind(this)
    }
    positionalRankImage(position, tier) {
        position = position.toLowerCase()
        tier = tier.toLowerCase()
        
        var pos_convert = {
            'top': 'Top',
            'bottom': 'Bot',
            'middle': 'Mid',
            'jungle': 'Jungle',
            'utility': 'Support',
            'support': 'Support',
        }
        position = pos_convert[position]

        var tier_convert = {
            'iron': 'Iron',
            'bronze': 'Bronze',
            'silver': 'Silver',
            'gold': 'Gold',
            'platinum': 'Plat',
            'diamond': 'Diamond',
            'master': 'Master',
            'grandmaster': 'Grandmaster',
            'challenger': 'Challenger',
        }
        tier = tier_convert[tier]

        return `${this.props.store.state.static}ranked-emblems/positions/Position_${tier}-${position}.png`
    }
    generalRankImage(tier) {
        tier = tier.toLowerCase()
        var tier_convert = {
            'iron': 'Iron',
            'bronze': 'Bronze',
            'silver': 'Silver',
            'gold': 'Gold',
            'platinum': 'Plat',
            'diamond': 'Diamond',
            'master': 'Master',
            'grandmaster': 'Grandmaster',
            'challenger': 'Challenger',
        }
        tier = tier_convert[tier]

        return `${this.props.store.state.static}ranked-emblems/emblems/Emblem_${tier}.png`
    }
    soloPositions() {
        var pos = []
        for (var p of this.props.positions) {
            if (p.position !== 'NONE') {
                pos.push(p)
            }
        }
        return pos
    }
    miniSeries(progress) {
        var letters = []
        for (var l of progress) {
            letters.push(l)
        }
        return (
            letters.map((letter, key) => {
                var shared_styles = {
                    margin:'0 2px',
                    display: 'inline-block',
                    height:14, width:14,
                    borderRadius:7,
                    borderWidth:1,
                    borderStyle:'solid',
                    borderColor:'grey',
                }
                if (letter === 'W') {
                    return (
                        <div
                            key={key}
                            style={{
                                ...shared_styles,
                                background: this.props.pageStore.state.victory_color,
                            }}>
                        </div>
                    )
                }
                else if (letter === 'L') {
                    return (
                        <div
                            key={key}
                            style={{
                                ...shared_styles,
                                background: this.props.pageStore.state.loss_color,
                            }}>
                        </div>
                    )
                }
                else {
                    return (
                        <div
                            key={key}
                            style={{
                                ...shared_styles,
                                background: 'grey',
                            }}>
                        </div>
                    )
                }
            })
        )
    }
    render() {
        return (
            <span>
                <div style={{position:'relative', padding:18}} className={`card-panel ${this.props.store.state.theme}`}>
                    {this.props.icon.image_url !== undefined &&
                        <img
                            style={{
                                width:50,
                                display:'inline-block',
                                verticalAlign:'middle',
                                borderRadius:5,
                            }}
                            src={this.props.icon.image_url}
                            alt={`profile icon ${this.props.icon._id}`}/>
                    }

                    <div
                        style={{
                            display: 'inline-block',
                            width:300,
                            maxWidth:'87%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            height:25,
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                        }}>
                        {this.props.summoner.name}
                    </div>

                    {this.soloPositions().length > 0 &&
                        <hr/>
                    }

                    <div>
                        {this.props.positions.map(pos => {
                            if (pos.position !== 'NONE') {
                                return (
                                    <div key={`${pos.position}-${this.props.summoner._id}`}>
                                        <div>
                                            <div style={{display: 'inline-block', width:50}}>
                                                <img
                                                    src={this.positionalRankImage(pos.position, pos.tier)}
                                                    style={{height:40}}
                                                    alt=""/>
                                            </div>
                                            <div style={{display: 'inline-block', lineHeight:1, verticalAlign:'super'}}>
                                                <span>
                                                    {pos.tier} {pos.rank}
                                                </span>
                                                <br/>
                                                <small>
                                                    {pos.wins} wins / {pos.losses} losses
                                                </small>
                                            </div>
                                            <div style={{
                                                display: 'inline-block',
                                                position:'absolute',
                                                right:18,
                                                }}>
                                                <span style={{
                                                    background: 'gray',
                                                    borderRadius: 5,
                                                    padding: '0 5px'}}>
                                                    {pos.leaguePoints} LP
                                                </span>
                                                {pos.miniSeries !== undefined &&
                                                    <div>
                                                        {this.miniSeries(pos.miniSeries.progress)}
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        })}
                        {this.props.positions.map(pos => {
                            if (pos.position === 'NONE') {
                                return (
                                    <div key={`${pos.position}-${this.props.summoner._id}`}>
                                        <hr/>
                                        <div>
                                            <div style={{display: 'inline-block', width:50}}>
                                                <img
                                                    src={this.generalRankImage(pos.tier)}
                                                    style={{height:40}}
                                                    alt=""/>
                                            </div>
                                            <div style={{display: 'inline-block', lineHeight:1, verticalAlign:'super'}}>
                                                <span>
                                                    {pos.tier} {pos.rank}
                                                </span>
                                                <br/>
                                                <small>
                                                    {pos.wins} wins / {pos.losses} losses
                                                </small>
                                            </div>
                                            <div style={{
                                                display: 'inline-block',
                                                position:'absolute',
                                                right:18,
                                                }}>
                                                <span style={{
                                                    background: 'gray',
                                                    borderRadius: 5,
                                                    padding: '0 5px'}}>
                                                    {pos.leaguePoints} LP
                                                </span>
                                                {pos.miniSeries !== undefined &&
                                                    <div>
                                                        {this.miniSeries(pos.miniSeries.progress)}
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        })}
                    </div>
                </div>
            </span>
        )
    }
}
SummonerCard.propTypes = {
    store: PropTypes.any,
    pageStore: PropTypes.any,
}


class RecentlyPlayedWith extends Component {
    constructor(props) {
        super(props)
        this.state = {}

        this.countPlayers = this.countPlayers.bind(this)
        this.sortPlayers = this.sortPlayers.bind(this)
    }
    countPlayers() {
        var count = {}
        for (var match of this.props.matches) {
            for (var p of match.participants) {
                if (p.account_id === this.props.summoner.account_id) {
                    // ignore self
                }
                else {
                    if (count[p.summoner_name] === undefined) {
                        count[p.summoner_name] = 1
                    }
                    else {
                        count[p.summoner_name] += 1
                    }
                }
            }
        }
        return count
    }
    sortPlayers() {
        var count_dict = this.countPlayers()
        var count_list = []
        for (var name in count_dict) {
            // only add to list if count > 1
            if (count_dict[name] > 1) {
                count_list.push({
                    summoner_name: name,
                    count: count_dict[name],
                })
            }
        }
        count_list.sort((a, b) => {
            return b.count - a.count
        })
        return count_list
    }
    render() {
        return (
            <div
                style={{
                    width:250,
                    height:200,
                    marginLeft:15,
                    padding:15,
                }}
                className={`card-panel ${this.props.store.state.theme}`}>
                <div style={{textDecoration:'underline', display:'inline-block'}}>
                    Recent Players
                </div>{' '}
                <small>{this.props.matches.length} games</small>
                <br/>
                <div className='quiet-scroll' style={{overflowY: 'scroll', maxHeight:'85%'}}>
                    <table>
                        {this.sortPlayers().map(data => {
                            var td_style = {padding: '3px 5px'}
                            return(
                                <tbody key={`row-for-${data.summoner_name}`} style={{fontSize:'small'}}>
                                    <tr>
                                        <td style={td_style}>
                                            <Link className={`${this.props.store.state.theme}`} to={`/${this.props.pageStore.props.region}/${data.summoner_name}/`}>
                                                {data.summoner_name}
                                            </Link>
                                        </td>
                                        <td style={td_style}>{data.count}</td>
                                    </tr>
                                </tbody>
                            )
                        })}
                    </table>
                </div>
            </div>
        )
    }
}
RecentlyPlayedWith.propTypes = {
    store: PropTypes.object,
    pageStore: PropTypes.object,
    summoner: PropTypes.object,
    matches: PropTypes.array,
}

export default Summoner