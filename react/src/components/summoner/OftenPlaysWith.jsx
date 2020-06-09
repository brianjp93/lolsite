import React from 'react'
import { useState } from 'react'
import api from '../../api/api'
import { useEffect } from 'react'

import numeral from 'numeral'

export function OftenPlaysWith(props) {
    const [queue_id, setQueueId] = useState(null)
    const [season_id, setSeasonId] = useState(null)
    const [recent, setRecent] = useState(null)
    const [recent_days, setRecentDays] = useState(90)
    const [start, setStart] = useState(0)
    const [end, setEnd] = useState(10)
    const [players, setPlayers] = useState([])
    const [player_names, setPlayerNames] = useState([])

    const summoner_id = props.summoner_id
    const store = props.store
    const region = props.region

    function getTopPlayedWith() {
        let data = {
            queue_id,
            season_id,
            recent,
            recent_days,
            start,
            end,
            summoner_id,
            group_by: 'account_id',
        }
        api.player.getTopPlayedWith(data)
            .then(response => {
                setPlayers(response.data.data)
            })
            .catch(error => {
                console.log('Error while retrieving players.')
            })
    }

    function getPlayerNames() {
        let data = {
            account_ids: players.map(item => item.account_id),
            region: region,
        }
        api.player.getSummoners(data)
            .then(response => {
                let modified = {}
                for (let summoner of response.data.data) {
                    modified[summoner.account_id] = summoner
                }
                let new_players = []
                for (let summoner of players) {
                    summoner.name = modified[summoner.account_id].name
                    new_players.push(summoner)
                }
                setPlayerNames(new_players)
            })
    }

    useEffect(() => {
        if (summoner_id) {
            getTopPlayedWith()
        }
    }, [summoner_id, queue_id, season_id, recent, start, end])

    useEffect(() => {
        if (players.length > 0) {
            getPlayerNames()
        }
    }, [players])

    return (
        <div>
            <small>Over the past {recent_days} days.</small>
            <table className='table'>
                <thead>
                    <tr>
                        <th>name</th>
                        <th>wins</th>
                        <th>games</th>
                    </tr>
                </thead>
                <tbody>
                    {player_names.map(player => {
                        let win_perc = (player.wins / player.count) * 100
                        win_perc = numeral(win_perc).format('0.0')
                        return (
                            <tr key={player.account_id}>
                                <td> {player.name} </td>
                                <td>
                                    {player.wins} <small>{win_perc}%</small>
                                </td>
                                <td> {player.count} </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
