import React, { useCallback } from 'react'
import { useState } from 'react'
import api from '../../api/api'
import { useEffect } from 'react'

import numeral from 'numeral'

export function OftenPlaysWith(props) {
    const [players, setPlayers] = useState([])
    const [player_names, setPlayerNames] = useState([])

    const queue_id = null
    const season_id = null
    const recent = null
    const recent_days = 90
    const start = 0
    const end = 10

    const summoner_id = props.summoner_id
    const region = props.region

    const getTopPlayedWith = useCallback(() => {
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
        return api.player.getTopPlayedWith(data)
    }, [summoner_id])

    useEffect(() => {
        if (summoner_id) {
            getTopPlayedWith()
                .then(response => {
                    setPlayers(response.data.data)
                })
        }
    }, [getTopPlayedWith, summoner_id])

    useEffect(() => {
        if (players.length > 0) {
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
                        if (modified[summoner.account_id]) {
                            summoner.name = modified[summoner.account_id].name
                            new_players.push(summoner)
                        }
                    }
                    setPlayerNames(new_players)
                })
        }
    }, [players, region])

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
                        if (player.name) {
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
                        }
                        else {
                            return null
                        }
                    })}
                </tbody>
            </table>
        </div>
    )
}
