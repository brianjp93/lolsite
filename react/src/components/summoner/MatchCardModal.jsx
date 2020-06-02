import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    const [timeline, setTimeline] = useState({})

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
        return (
            <div>
                <div className="center-align">
                    <div
                        className='left-align'
                        style={{width: 400, display: 'inline-block'}}>
                        {team_100.map(part => {
                            return <div key={`${part.id}`}>{participantLine(part)}</div>
                        })}
                    </div>

                    <div
                        className='left-align'
                        style={{width: 400, display: 'inline-block'}}>
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
                    <Link to={`/${props.region}/${part.summoner_name}/`}>
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

    useEffect(() => {
        if (match_id !== undefined) {
            getMatch()
            getParticipants()
            getTimeline()
        }
    }, [match_id])

    return (
        <div>
            <div>
                <h4
                    style={{
                        display: 'inline-block',
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
                </div>
                <div>
                    patch {match.major}.{match.minor}
                </div>
            </div>

            <div>
                {showParticipants()}
            </div>
        </div>
    )
}

export default MatchCardModal
