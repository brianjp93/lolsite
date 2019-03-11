import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'
import MatchCard from './MatchCard'

import api from '../../api/api'


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
            is_reloading_matches: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',
            match_card_height: 400,

            positions: [],

            last_scroll_time: (new Date()).getTime(),
        }

        this.getSummonerPage = this.getSummonerPage.bind(this)
        this.getNextPage = this.getNextPage.bind(this)
        this.setQueueDict = this.setQueueDict.bind(this)
        this.getPositions = this.getPositions.bind(this)
        this.setDefaults = this.setDefaults.bind(this)
        this.reloadMatches = this.reloadMatches.bind(this)
        this.saveStateToStore = this.saveStateToStore.bind(this)
        this.loadStateFromStore = this.loadStateFromStore.bind(this)
    }
    componentDidMount() {
        var first_load = this.loadStateFromStore()
        if (first_load) {
            this.getSummonerPage(this.getPositions)
            this.setQueueDict()
        }
    }
    componentDidUpdate(prevProps, prevState) {
        // new summoner
        if (this.props.route.match.params.summoner_name !== prevProps.route.match.params.summoner_name) {
            this.saveStateToStore(prevState)
            this.setDefaults(() => {
                var first_load = this.loadStateFromStore()
                if (first_load) {
                    this.getSummonerPage(this.getPositions)
                }
            })
        }
    }
    componentWillUnmount() {
        // save the current state into our store
        this.saveStateToStore(this.state)
    }
    saveStateToStore(state) {
        var new_summoners = this.props.store.state.summoners
        if (new_summoners[this.props.region] === undefined) {
            new_summoners[this.props.region] = {}
        }
        if (state.summoner !== undefined) {
            if (state.summoner.name !== undefined) {
                var name = state.summoner.name
                var simple = name.split(' ').join('').toLowerCase()
                new_summoners[this.props.region][simple] = state
                this.props.store.setState({summoners: new_summoners})
            }
        }
    }
    loadStateFromStore() {
        var name = this.props.route.match.params.summoner_name
        var simple = name.split(' ').join('').toLowerCase()

        var first_load = false
        if (this.props.store.state.summoners[this.props.region] !== undefined) {
            if (this.props.store.state.summoners[this.props.region][simple] !== undefined) {
                this.setState(this.props.store.state.summoners[this.props.region][simple])
            }
            else {
                first_load = true
            }
        }
        else {
            first_load = true
        }
        return first_load
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
        if (!this.state.is_reloading_matches) {
            this.setState({is_requesting_page: true})
        }
        var params = this.props.route.match.params
        var data = {
            summoner_name: params.summoner_name ? params.summoner_name: null,
            id: params.id ? params.id: null,
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
                    positions: response.data.positions,
                    is_requesting_page: false,
                    is_reloading_matches: false,
                }, () => {
                    if (callback !== undefined) {
                        callback()
                    }
                })
            })
            .catch((error) => {
                window.alert('No summoner with that name was found.')
                this.setState({is_requesting_page: false, is_reloading_matches: false})
            })
    }
    reloadMatches() {
        this.setState({
            match_ids: new Set(),
            next_page: 2,
            is_reloading_matches: true
        }, () => {
            this.getSummonerPage(this.getPositions)
        })
    }
    getNextPage() {
        this.setState({is_requesting_next_page: true})
        var params = this.props.route.match.params
        var data = {
            summoner_name: params.summoner_name,
            id: this.state.summoner.id,
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
                                ref={(elt) => {this.match_list = elt}}
                                onWheel={(event) => {
                                    if (!this.props.store.state.ignore_horizontal) {
                                        return convertVerticalScroll(event)
                                    }
                                    return null
                                }}
                                onScroll={(event) => {
                                    setTimeout(() => {
                                        var epoch = (new Date()).getTime()
                                        if (epoch - this.state.last_scroll_time > 1000) {
                                            this.setState({last_scroll_time: epoch, scroll_left: this.match_list.scrollLeft})
                                        }
                                    }, 1000)
                                }} >
                                
                                {/* MATCH CARD */}
                                {this.state.matches.map((match, key) => {
                                    return (
                                        <MatchCard
                                            key={`${key}-${match._id}`}
                                            store={this.props.store}
                                            pageStore={this}
                                            match={match} />
                                    )
                                })}

                                <div
                                    style={{
                                        width:100, height: this.state.match_card_height,
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
    queueName(queue) {
        var out = queue
        var convert = {
            'RANKED_SOLO_5x5': 'Solo/Duo',
            'RANKED_FLEX_SR': '5v5 Flex',
            'RANKED_FLEX_TT': '3v3 Flex',
        }
        if (convert[queue] !== undefined) {
            out = convert[queue]
        }
        return out
    }
    render() {
        var reload_attrs = {
            disabled: this.props.pageStore.state.is_reloading_matches ? true: false,
        }
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

                    <span style={{position: 'absolute', right:2, top:2}}>
                        <button {...reload_attrs}
                            className="dark btn-small"
                            onClick={this.props.pageStore.reloadMatches} >
                            <i className="material-icons">autorenew</i>
                        </button>
                    </span>

                    {this.soloPositions().length > 0 &&
                        <hr/>
                    }

                    <div>
                        {this.props.positions.map(pos => {
                            if (pos.queue_type === 'RANKED_SOLO_5x5') {
                                var gen_positions = ['NONE', 'APEX']
                                return (
                                    <div key={`${pos.position}-${this.props.summoner._id}`}>
                                        <div>
                                            <div style={{display: 'inline-block', width:50}}>
                                                {gen_positions.indexOf(pos.position) === -1 &&
                                                    <img
                                                        src={this.positionalRankImage(pos.position, pos.tier)}
                                                        style={{height:40}}
                                                        alt=""/>
                                                }
                                                {gen_positions.indexOf(pos.position) >= 0 &&
                                                    <img
                                                        src={this.generalRankImage(pos.tier)}
                                                        style={{height:40}}
                                                        alt=""/>
                                                }
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
                                                <small className={`${this.props.store.state.theme} pill`}>
                                                    {this.queueName(pos.queue_type)}
                                                </small>{' '}
                                                <span className={`${this.props.store.state.theme} pill`}>
                                                    {pos.league_points} LP
                                                </span>
                                                {pos.series_progress &&
                                                    <div style={{textAlign: 'right'}}>
                                                        {this.miniSeries(pos.series_progress)}
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
                            if (pos.queue_type !== 'RANKED_SOLO_5x5') {
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
                                                <small className={`${this.props.store.state.theme} pill`}>
                                                    {this.queueName(pos.queue_type)}
                                                </small>{' '}
                                                <span className={`${this.props.store.state.theme} pill`}>
                                                    {pos.league_points} LP
                                                </span>
                                                {pos.series_progress &&
                                                    <div style={{textAlign: 'right'}}>
                                                        {this.miniSeries(pos.series_progress)}
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