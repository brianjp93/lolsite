import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Timeline } from './Timeline'
import ChampionTimelines from './ChampionTimelines'
import StatOverview from './StatOverview'

import numeral from 'numeral'
import api from '../../api/api'
import {
    formatDatetime,
    formatDatetimeFull,
    getTeam,
    participantItems,
} from '../../constants/general'


function MatchCardModal(props) {
    let store = props.store
    let route = props.route
    let match_id = props.route.match.params.match_id
    
    const [match, setMatch] = useState({})
    const [participants, setParticipants] = useState([])
    const [timeline, setTimeline] = useState([])

    const team_100 = getTeam(100, participants)
    const team_200 = getTeam(200, participants)

    function getMatch() {
        let data = {
            match_id,
        }
        api.match.getMatch(data)
            .then(response => {
                setMatch(response.data.data)
            })
    }

    function getParticipants() {
        let data = {
            match__id: match_id,
        }
        api.match.participants(data)
            .then(response => {
                setParticipants(response.data.data)
            })
    }

    function getTimeline() {
        let data = {
            match_id,
        }
        api.match.timeline(data)
            .then(response => {
                setTimeline(response.data.data)
            })
    }

    function showParticipants() {
        let div_style = {
            width: 450,
            display: 'inline-block',
            borderWidth: 1,
            borderColor: 'grey',
            borderStyle: 'solid',
            borderRadius: 4,
            padding: '0px 8px',
        }
        return (
            <div>
                <div className="center-align">
                    <div
                        className='left-align'
                        style={div_style}>
                        {team_100.map(part => {
                            return <div key={`${part.id}`}>{participantLine(part)}</div>
                        })}
                    </div>

                    <div style={{width: 8, display: 'inline-block'}}></div>

                    <div
                        className='left-align'
                        style={div_style}>
                        {team_200.map(part => {
                            return <div key={`${part.id}`}>{participantLine(part)}</div>
                        })}
                    </div>
                </div>
            </div>
        )
    }

    function participantLine(part) {
        return (
            <div style={{height: 120}}>
                <div style={{marginBottom: 3}}>
                    <Link
                        target='_blank'
                        to={`/${props.region}/${part.summoner_name}/`}>
                        {part.summoner_name}
                    </Link>
                </div>
                <div
                    style={{
                        display: 'inline-block',
                        paddingRight: 5,
                        verticalAlign: 'top'}} >
                    <div>
                        <img
                            style={{height: 40, display:'inline'}}
                            src={part.champion.image_url}
                            alt=""/>
                        <div style={{display:'inline-block', paddingLeft:4}}>
                            <img
                                style={{height:20, display:'block'}}
                                src={part.spell_1_image_url} alt="" />
                            <img
                                style={{height:20, display:'block'}}
                                src={part.spell_2_image_url} alt="" />
                        </div>
                    </div>
                    <img
                        style={{height: 20, verticalAlign: 'top'}}
                        src={part.stats.perk_0_image_url}
                        alt=""/>
                    <img
                        style={{height: 20, verticalAlign: 'top'}}
                        src={part.stats.perk_sub_style_image_url}
                        alt=""/>
                    <img
                        style={{
                            height: 20,
                            verticalAlign: 'top',
                            marginLeft: 4,
                            borderRadius: 5,
                        }}
                        src={part.stats.item_6_image_url} alt=""/>
                </div>

                {participantItems(part, match, store)}

            </div>
        )
    }

    function getMyPart() {
        // get my participant
        let account_id = props.summoner.account_id
        for (let part of participants) {
            if (part.account_id === account_id) {
                return part
            }
        }
    }

    function isDataAcquired() {
        let out = true
        if (timeline.length === 0) {
            out = false
        }
        if (participants.length === 0) {
            out = false
        }
        if (match._id === undefined) {
            out = false
        }
        return out
    }

    useEffect(() => {
        if (match_id !== undefined) {
            getMatch()
            getParticipants()
            getTimeline()
        }
    }, [match_id])

    const header_style = {
        textAlign: 'center',
        textDecoration: 'underline',
    }
    const comp_style = {
        display: 'inline-block',
        verticalAlign: 'top'
    }
    return (
        <div style={{marginBottom: 300}}>
            <div>
                <h4
                    style={{
                        display: 'inline-block',
                        marginTop: 4,
                        marginBottom: 8,
                        marginRight: 8,
                    }}>
                    {store.state.queue_convert[match.queue_id] !== undefined &&
                        <span>
                            {store.state.queue_convert[match.queue_id].description}
                        </span>
                    }
                </h4>
                <div style={{display: 'inline-block'}}>
                    {formatDatetimeFull(match.game_creation)}
                    <span> -- </span>
                    {`${Math.floor(match.game_duration / 60)}:${numeral(match.game_duration % 60).format('00')}`}
                </div>
                <div>
                    patch {match.major}.{match.minor}
                </div>
            </div>

            <div>
                {showParticipants()}
            </div>

            <div style={{marginTop: 20}}>

                {isDataAcquired() &&
                    <React.Fragment>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }}>
                            <div style={comp_style}>
                                <h5 style={header_style}>
                                    Game Timeline
                                </h5>
                                <Timeline
                                    summoner={props.summoner}
                                    match={match}
                                    participants={participants}
                                    timeline={timeline}
                                    store={props.store}
                                    route={props.route} />
                            </div>
                            <div style={comp_style}>
                                <div style={{marginLeft: 30, marginRight: 8}}>
                                    <h5 style={header_style}>
                                        Champion Timelines
                                    </h5>
                                    <ChampionTimelines
                                        theme={store.state.theme}
                                        my_part={getMyPart()}
                                        summoner={props.summoner}
                                        participants={participants}
                                        timeline={timeline}
                                        expanded_width={500} />
                                </div>
                            </div>
                            <div style={comp_style}>
                                <h5 style={header_style}>
                                    Champion Stats
                                </h5>
                                <StatOverview
                                    participants={participants}
                                    match={match}
                                    store={props.store}
                                    pageStore={props.pageStore}
                                    mypart={getMyPart()}
                                    is_expanded={true} />
                            </div>
                        </div>
                    </React.Fragment>
                }

            </div>
        </div>
    )
}

export default MatchCardModal
