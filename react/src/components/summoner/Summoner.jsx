import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import AtomSpinner from '@bit/bondz.react-epic-spinners.atom-spinner'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'
import MatchCard from './MatchCard'
import Spectate from './Spectate'
import SummonerNotFound from './SummonerNotFound'
import PlayerChampionSummary from './PlayerChampionSummary'
import numeral from 'numeral'

import MatchFilter from './MatchFilter'
import api from '../../api/api'
import Footer from '../general/Footer'


function convertVerticalScroll(event)  {
    var elt = event.currentTarget
    var delta = (Math.abs(event.deltaX) < Math.abs(event.deltaY) ? event.deltaY : event.deltaX)
    
    if (delta < 0) {
        if (elt.scrollLeft === 0) {
            // comment out to revert to vertical scroll when we hit the left edge
            elt.scrollLeft += delta
        }
        else {
            elt.scrollLeft += delta
        }
    }
    else {
        if ((elt.scrollLeft + elt.clientWidth) === elt.scrollWidth) {
            // comment out to revert to vertical scroll when we hit the right edge
            elt.scrollLeft += delta
        }
        else {
            elt.scrollLeft += delta
        }
    }
    event.preventDefault()
}


class Summoner extends Component {
    constructor(props) {
        super(props)

        this.state = {
            summoner: {},
            icon: {},
            matches: [],
            match_ids: new Set(),
            count: 20,
            next_page: 2,
            last_refresh: null,

            is_requesting_page: false,
            is_requesting_next_page: false,
            is_reloading_matches: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',
            match_card_height: 400,

            positions: [],

            last_scroll_time: (new Date()).getTime(),

            is_spectate_modal_open: false,
            is_live_game: false,

            // filtering
            match_filters: {},
        }

        this.getSummonerPage = this.getSummonerPage.bind(this)
        this.getNextPage = this.getNextPage.bind(this)
        this.setQueueDict = this.setQueueDict.bind(this)
        this.getPositions = this.getPositions.bind(this)
        this.setDefaults = this.setDefaults.bind(this)
        this.reloadMatches = this.reloadMatches.bind(this)
        this.getSpectate = this.getSpectate.bind(this)
        this.checkForLiveGame = this.checkForLiveGame.bind(this)
        this.handleWheel = this.handleWheel.bind(this)
        this.getFilterParams = this.getFilterParams.bind(this)
        this.isTriggerImport = this.isTriggerImport.bind(this)
    }
    componentDidMount() {
        this.getSummonerPage(() => {
            this.getPositions()
            this.checkForLiveGame()
            let now = new Date().getTime()
            this.setState({last_refresh: now})
        })
        this.setQueueDict()
    }
    componentDidUpdate(prevProps, prevState) {
        // new summoner
        if (
            this.props.route.match.params.summoner_name !== prevProps.route.match.params.summoner_name ||
            this.props.region !== prevProps.region
        ) {
            this.setState({match_filters: {}}, () => {
                this.getSummonerPage(() => {
                    this.getPositions()
                    this.checkForLiveGame()
                    let now = new Date().getTime()
                    this.setState({last_refresh: now})
                })
            })
        }
    }
    componentWillUnmount() {
        try {
            this.match_list.removeEventListener('wheel', this.handleWheel)
        }
        catch(error) {
            console.log('Attempted to remove event listener but got an error.')
        }
    }
    handleWheel(event) {
        if (!this.props.store.state.ignore_horizontal) {
            return convertVerticalScroll(event)
        }
        else {
            return event
        }
    }
    setDefaults(callback) {
        var defaults = {
            summoner: {},
            icon: {},
            matches: [],
            match_ids: new Set(),
            next_page: 2,
            is_requesting_page: false,
            is_requesting_next_page: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',
            is_spectate_modal_open: false,

            positions: [],
        }
        this.setState(defaults, () => {
            if (callback !== undefined) {
                callback()
            }
        })
    }
    getFilterParams() {
        let params = this.props.route.match.params
        let filters = this.state.match_filters
        let data = {
            summoner_name: params.summoner_name ? params.summoner_name: null,
            id: params.id ? params.id: null,
            region: this.props.region,
            count: this.state.count,
            queue: filters.queue_filter,
            with_names: filters.summoner_filter !== undefined ? filters.summoner_filter.split(',') : '',
            champion_key: filters.champion,
        }
        return data
    }
    isTriggerImport() {
        // whether or not to check for new matches,
        // or just get matches from our DB
        let is_trigger_import = true
        let filters = this.state.match_filters
        if (filters.summoner_filter !== undefined && filters.summoner_filter.length > 0) {
            is_trigger_import = false
        }
        return is_trigger_import
    }
    getSummonerPage(callback) {
        if (!this.state.is_reloading_matches) {
            this.setState({is_requesting_page: true})
        }

        let data = this.getFilterParams()
        data.update = true

        if (this.isTriggerImport()) {
            data.trigger_import = true
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
                }, () => {
                    if (callback !== undefined) {
                        callback()
                    }
                })
            })
            .catch((error) => {
                console.log(error)
                // window.alert('No summoner with that name was found.')
                this.setState({summoner: false})
            })
            .then(() => {
                this.setState({is_requesting_page: false, is_reloading_matches: false})
            })
    }
    reloadMatches(callback) {
        this.setState({
            match_ids: new Set(),
            next_page: 2,
            is_reloading_matches: true,
        }, () => {
            this.getSummonerPage(() => {
                this.getPositions()
                this.setState({last_refresh: new Date().getTime()})
                if (callback !== undefined) {
                    try {
                        callback()
                    }
                    catch(error) {
                        console.log('Caught error in reloadMatches method in Summoner.jsx.')
                    }
                }
            })
        })
    }
    getNextPage() {
        this.setState({is_requesting_next_page: true})

        let data = this.getFilterParams()
        data.update = false
        data.trigger_import = true
        data.after_index = this.state.matches.length
        data.page = this.state.next_page

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
    getSpectate() {
        var data = {
            region: this.props.region,
            summoner_id: this.state.summoner._id,
        }
        api.match.getSpectate(data)
            .then(response => {
                this.setState({spectate: response.data.data})
            })
            .catch(error => {
                console.log(error)
            })
    }
    checkForLiveGame() {
        var data = {
            region: this.props.region,
            summoner_id: this.state.summoner._id,
        }
        api.match.checkForLiveGame(data)
            .then(response => {
                this.setState({is_live_game: true})
            })
            .catch(error => {
                if (error.response !== undefined) {
                    if (error.response.status === 404) {
                        this.setState({is_live_game: false})
                    }
                }
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
        const custom_max_width = 'col l10 offset-l1 m12 s12'
        const store = this.props.store
        const theme = store.state.theme
        return (
            <div>
                <div style={{minHeight: 1000}}>
                    <NavBar store={this.props.store} region={this.props.region} />
                    {this.state.is_requesting_page &&
                        <div>
                            <div 
                                style={{
                                    textAlign: 'center',
                                    marginTop: 100,
                                }} >
                                <AtomSpinner
                                    color='#ffffff'
                                    size={200}
                                    style={{margin: 'auto'}} />
                            </div>
                        </div>
                    }

                    {!this.state.is_requesting_page && this.state.summoner === false &&
                        <SummonerNotFound store={this.props.store} />
                    }

                    {!this.state.is_requesting_page && this.state.summoner !== false &&
                        <div>
                            <div className="row" style={{marginBottom: 0}}>
                                <div className="col l10 offset-l1">
                                    <div
                                        style={{
                                            width:400,
                                            display:'inline-block',
                                            marginRight: 15,
                                        }}>
                                        {this.state.summoner.name !== undefined &&
                                            <SummonerCard
                                                last_refresh={this.state.last_refresh}
                                                positions={this.state.positions}
                                                icon={this.state.icon}
                                                summoner={this.state.summoner}
                                                store={this.props.store}
                                                pageStore={this} />
                                        }
                                    </div>

                                    <div style={{display: 'inline-block', verticalAlign: 'top'}}>
                                        <div
                                            style={{
                                                minWidth: 750,
                                                padding: 15,
                                            }}
                                            className={`${theme} card-panel`}>
                                            <PlayerChampionSummary
                                                store={store}
                                                parent={this}
                                                summoner={this.state.summoner} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className={`${custom_max_width}`}>
                                    <div className="row">
                                        <div className="col l6 m12">
                                            <MatchFilter store={store} parent={this} />
                                        </div>
                                        <div className="col l6 m12">
                                            <div style={{display:'inline-block', verticalAlign:'top'}}>
                                                <RecentlyPlayedWith
                                                    matches={this.state.matches}
                                                    store={this.props.store}
                                                    pageStore={this}
                                                    summoner={this.state.summoner} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='row' >
                                <div
                                    style={{paddingTop:15, background: '#ffffff14', borderRadius: 5}}
                                    className="horizontal-scroll quiet-scroll col l10 offset-l1 m12 s12"
                                    ref={(elt) => {
                                        this.match_list = elt
                                        try {
                                            elt.addEventListener('wheel', this.handleWheel, {passive: false})
                                        } catch (error) {}
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
                                                index={key}
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
                                                <span style={{fontWeight: 'bold', textDecoration: 'underline'}}>More</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <Footer store={this.props.store} />
            </div>
        )
    }
}


class SummonerCard extends Component {
    constructor(props) {
        super(props)

        this.state = {
            has_been_set: false,
        }

        this.positionalRankImage = this.positionalRankImage.bind(this)
        this.generalRankImage = this.generalRankImage.bind(this)
        this.soloPositions = this.soloPositions.bind(this)
        this.miniSeries = this.miniSeries.bind(this)
        this.setRefreshTime = this.setRefreshTime.bind(this)
    }
    componentDidMount() {
        this.setRefreshTime()
        this.refresh_timer = setInterval(this.setRefreshTime, 60000)
    }
    componentWillUnmount() {
        clearInterval(this.refresh_timer)
    }
    componentDidUpdate(prevProps) {
        if (!this.state.has_been_set) {
            this.setRefreshTime()
        }
        else if (this.props.last_refresh !== prevProps.last_refresh) {
            this.setRefreshTime()
        }
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
            'platinum': 'Platinum',
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
    setRefreshTime() {
        var now = new Date().getTime()
        var last_refresh = this.props.pageStore.state.last_refresh
        if (last_refresh !== null) {
            var diff = Math.round((now - last_refresh) / 1000)
            var minutes = Math.floor(diff / 60)
            if (minutes > 0) {
                if (minutes === 1) {
                    this.refresh_time.innerHTML = `a minute ago`
                }
                else if (minutes > 99) {
                    this.refresh_time.innerHTML = 'a long time ago'
                }
                else {
                    this.refresh_time.innerHTML = `${minutes} minutes ago`
                }
            }
            else {
                this.refresh_time.innerHTML = 'a moment ago'
            }
            if (!this.state.has_been_set) {
                this.setState({has_been_set: true})
            }
        }
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
    getWinRate(wins, losses) {
        var rate = wins / (wins + losses)
        return rate * 100
    }
    render() {
        var reload_attrs = {
            disabled: this.props.pageStore.state.is_reloading_matches ? true: false,
        }
        let pageStore = this.props.pageStore
        return (
            <span>
                <div style={{position:'relative', padding:18}} className={`card-panel ${this.props.store.state.theme}`}>
                    {this.props.icon.image_url !== undefined &&
                        <img
                            style={{
                                height:50,
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
                        }}>
                        <span style={{textDecoration: 'underline', fontWeight: 'bold',}}>{this.props.summoner.name}</span>
                        <br/>
                        <Spectate.SpectateModal queue_convert={this.props.store.state.queue_convert} theme={this.props.store.state.theme} summoner_id={this.props.summoner._id} pageStore={this.props.pageStore}>
                            <small>
                                {this.props.pageStore.state.is_live_game ? 'Live Game!': 'Check For Game'}
                            </small>
                        </Spectate.SpectateModal>
                    </div>

                    <span style={{position: 'absolute', right: 2, top: 2}}>
                        <small
                            className='unselectable'
                            style={{
                                display: 'inline-block',
                                verticalAlign: 'top',
                                marginRight: 3,
                                borderStyle: 'solid',
                                borderWidth: 1,
                                padding: 2,
                                borderRadius: 3,
                                borderColor: '#ffffff40',
                                color: '#ffffff70',
                                marginTop: 3,
                            }}>
                            {pageStore.last_refresh !== null &&
                                <span>Last Refresh:{' '}</span>
                            }
                            <span ref={(elt) => {this.refresh_time = elt}} style={{fontWeight:'bold'}} >
                            </span>
                        </small>
                        <button {...reload_attrs}
                            className="dark btn-small"
                            onClick={this.props.pageStore.reloadMatches} >
                            <i className="material-icons">autorenew</i>
                        </button>
                    </span>

                    {this.soloPositions().length > 0 &&
                        <hr/>
                    }

                    <div style={{paddingTop:10}}>
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
                                                    <span style={{fontWeight: 'bold'}}>{`${numeral(this.getWinRate(pos.wins, pos.losses)).format('0.0')}%`}</span>{' '}-{' '}
                                                    {pos.wins}W / {pos.losses}L
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
                                                    <span style={{fontWeight: 'bold'}}>{`${numeral(this.getWinRate(pos.wins, pos.losses)).format('0.0')}%`}</span>{' '}-{' '}
                                                    {pos.wins}W / {pos.losses}L
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
    last_refresh: PropTypes.any,
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
                else if ([0, '0'].indexOf(p.account_id) >= 0) {
                    // ignore bots
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
                    width:270,
                    height:150,
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