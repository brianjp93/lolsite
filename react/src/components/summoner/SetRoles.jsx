import { useState } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import { useEffect, useCallback } from 'react'

import { ParticipantItems } from '../../constants/general'


function SetRoles(props) {
    const [match, setMatch] = useState({})
    const [participants, setParticipants] = useState([])

    const [roles, setRoles] = useState(['', '', '', '', '', '', '', '', '', ''])

    const team_100 = participants.filter(item => item.team_id === 100)
    const team_200 = participants.filter(item => item.team_id === 200)
    const participants_ordered = [...team_100, ...team_200]

    function resetRoles() {
        setRoles(['', '', '', '', '', '', '', '', '', ''])
    }

    function getMatch() {
        api.match.getLatestUnlabeled({})
            .then(response => {
                setMatch(response.data.data)
            })
            .catch(error => {
                console.error('Error while retrieving match.')
            })
    }

    const getParticipants = useCallback(() => {
        let data = {match_id: match.id}
        api.match.participants(data)
            .then(response => {
                setParticipants(response.data.data)
            })
            .catch(error => {
                console.error('Error while retrieving participants.')
            })
    }, [match])

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
                        {team_100.map((part, key) => {
                            return <div key={`${part.id}`}>{participantLine(part, key)}</div>
                        })}
                    </div>

                    <div style={{width: 8, display: 'inline-block'}}></div>

                    <div
                        className='left-align'
                        style={div_style}>
                        {team_200.map((part, key) => {
                            key = key + 5
                            return <div key={`${part.id}`}>{participantLine(part, key)}</div>
                        })}
                    </div>
                </div>
            </div>
        )
    }

    function participantLine(part, key) {
        return (
            <div style={{height: 120}}>
                <div style={{marginBottom: 3}}>
                    <span
                        target='_blank'
                        to={`/${props.region}/${part.summoner_name}/`}>
                        {part.summoner_name}
                        <span> - </span>
                        <span>{part.lane}</span>
                    </span>
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

                <div style={{display: 'inline-block'}}>
                    <input
                        type="text"
                        value={roles[key].toString()}
                        onKeyDown={event => {
                            let is_set = false
                            let new_roles = [...roles]
                            if (event.key === 't') {
                                new_roles[key] = 0
                                is_set = true
                            }
                            else if (event.key === 'j') {
                                new_roles[key] = 1
                                is_set = true
                            }
                            else if (event.key === 'm') {
                                new_roles[key] = 2
                                is_set = true
                            }
                            else if (event.key === 'a') {
                                new_roles[key] = 3
                                is_set = true
                            }
                            else if (event.key === 's') {
                                new_roles[key] = 4
                                is_set = true
                            }

                            if (is_set) {
                                setRoles(new_roles)
                                setParticipantRole(participants_ordered[key].id, new_roles[key])
                            }

                            if (event.key === 'Enter') {
                                next()
                            }
                        }}
                        />
                    <h5>
                        {roleLabel(roles[key])}
                    </h5>
                </div>

                <ParticipantItems part={part} match={match} store={props.store} />

            </div>
        )
    }

    function setParticipantRole(participant_id, role_int) {
        let data = {participant_id, role: role_int}
        api.match.setRole(data)
            .then(response => {
                console.log(response.data)
            })
    }

    function roleLabel(num) {
        if (num === '') {
            return ''
        }
        else {
            let convert = ['TOP', 'JG', 'MID', 'ADC', 'SUP']
            return convert[num]
        }
    }

    function next() {
        getMatch()
        resetRoles()
    }

    useEffect(() => {
        getMatch()
    }, [])

    useEffect(() => {
        if (match.id) {
            getParticipants()
        }
    }, [match, getParticipants])

    return (
        <Skeleton store={props.store}>
            <div>
                {match.id}

                {showParticipants()}
            </div>

            <div>
                <button
                    style={{ width: '100%' }}
                    onClick={next}
                    className="btn btn-large">
                    NEXT
                </button>
            </div>
        </Skeleton>
    )
}

export default SetRoles
