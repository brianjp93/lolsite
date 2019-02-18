import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'

import api from '../../api/api'


class Summoner extends Component {
    constructor(props) {
        super(props)

        this.state = {
            summoner: {},
            icon: {},
            matches: [],

            is_requesting_page: false,

            victory_color: '#68b568',
            loss_color: '#c33c3c',
            neutral_color: 'lightblue',
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
    }
    componentDidMount() {
        this.getSummonerPage()
    }
    getSummonerPage(callback) {
        this.setState({is_requesting_page: true})
        var data = {
            summoner_name: this.props.route.match.params.summoner_name,
            region: this.props.region,
            update: true,
        }
        api.player.getSummonerPage(data)
            .then((response) => {
                this.setState({
                    summoner: response.data.summoner,
                    region: this.props.region,
                    icon: response.data.profile_icon,
                    matches: response.data.matches,
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
    leftTeamChampion(part) {
        return (
            <div>
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
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                </span>
            </div>
        )
    }
    rightTeamChampion(part) {
        return (
            <div style={{textAlign: 'right'}}>
                <span>
                    {part.account_id === this.state.summoner.account_id &&
                        <small style={{fontWeight:'bold'}}>
                            {this.formattedName(part.summoner_name)}
                        </small>
                    }
                    {part.account_id !== this.state.summoner.account_id &&
                        <small>
                            {this.formattedName(part.summoner_name)}
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
            <img
                style={{height:28, borderRadius: 10, padding:'0px 2px'}}
                src={image_url} alt=""/>
        )
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
                    <span>
                        <div style={{width:450, marginLeft:10}}>
                            {this.state.summoner.name !== undefined &&
                                <SummonerCard icon={this.state.icon} summoner={this.state.summoner} store={this.props.store} pageStore={this} />
                            }
                        </div>

                        <div>
                            <div className="horizontal-scroll">
                                
                                {/* MATCH CARD */}
                                {this.state.matches.map((match, key) => {
                                    let mypart = this.getMyPart(match)
                                    return (
                                        <div
                                            key={`${key}-${match._id}`}
                                            style={{width:300, height:500, display: 'inline-block', margin: '0px 10px 25px 10px', paddingTop:15}}
                                            className={`card-panel ${this.props.store.state.theme}`}>
                                            <div
                                                style={{
                                                    height:4,
                                                    borderTop: `4px solid ${this.topBarColor(match)}`,
                                                    borderRadius: '2px'
                                                }} >
                                            </div>
                                            <div className="row">
                                                <div style={{padding:'10px 0px 0px 0px'}} className="col s6">
                                                    {this.getTeam100(match).map((part, key) =>  <div key={`${key}-${part.account_id}`}>{this.leftTeamChampion(part)}</div>)}

                                                    <div style={{height:10}}></div>
                                                    
                                                    <div
                                                        style={{
                                                            marginRight: 5,
                                                            height:4,
                                                            borderTop: `3px solid ${this.getTeam100Color(match)}`,
                                                            borderRadius: '1px'
                                                        }} >
                                                    </div>
                                                </div>
                                                <div style={{padding:'10px 0px 0px 0px'}} className="col s6">
                                                    {this.getTeam200(match).map((part, key) =>  <div key={`${key}-${part.account_id}`}>{this.rightTeamChampion(part)}</div>)}
                                                    
                                                    <div style={{height:10}}></div>

                                                    <div
                                                        style={{
                                                            marginLeft: 5,
                                                            height:4,
                                                            borderTop: `3px solid ${this.getTeam200Color(match)}`,
                                                            borderRadius: '1px'
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

                                                <span style={{display: 'inline-block', verticalAlign:'top'}}>
                                                    <span style={{verticalAlign:'top'}}>
                                                        {mypart.stats.kills} / {mypart.stats.deaths} / {mypart.stats.assists}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}

                                <div style={{display: 'inline-block', width: 200}}></div>
                            </div>
                        </div>
                    </span>
                }
            </div>
        )
    }
}


class SummonerCard extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }
    render() {
        return (
            <span>
                <div className={`card-panel ${this.props.store.state.theme}`}>
                    {this.props.icon.image_url !== undefined &&
                        <img
                            style={{
                                width:50,
                                display:'inline-block',
                                verticalAlign:'middle'
                            }}
                            src={this.props.icon.image_url}
                            alt={`profile icon ${this.props.icon._id}`}/>
                    }

                    <div
                        style={{
                            display: 'inline-block',
                            width:350,
                            maxWidth:'87%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            height:25,
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                        }}>
                        {this.props.summoner.name}
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

export default Summoner