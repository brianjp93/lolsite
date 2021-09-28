import {useCallback, useEffect, useState} from 'react'
import api from '../../api/api'
import numeral from 'numeral'
import {TopPlayedWithPlayerType, SummonerType} from '../../types'

interface AugmentedTopPlayedWithPlayerType extends TopPlayedWithPlayerType {
    name?: string
}

export function OftenPlaysWith(props: {region: string; summoner_id: number}) {
    const [player_names, setPlayerNames] = useState<AugmentedTopPlayedWithPlayerType[]>([])

    const queue_id = null
    const season_id = null
    const recent = null
    const recent_days = 90
    const start = 0
    const end = 10

    const summoner_id = props.summoner_id
    const region = props.region

    const getSummonerPageUrl = (name: string) => {
        return `/${region}/${encodeURIComponent(name)}/`
    }

    const getTopPlayedWith = useCallback(() => {
        return api.player.getTopPlayedWith({
            queue_id,
            season_id,
            recent,
            recent_days,
            start,
            end,
            summoner_id,
            group_by: 'puuid',
        })
    }, [summoner_id])

    useEffect(() => {
        if (summoner_id) {
            getTopPlayedWith().then((data) => {
                const players: AugmentedTopPlayedWithPlayerType[] = [...data]
                if (players.length > 0) {
                    api.player.getSummoners({
                        puuids: players.map((item) => item.puuid),
                        region: region,
                    }).then((summoners) => {
                        let modified: Record<string, SummonerType> = {}
                        for (let summoner of summoners) {
                            modified[summoner.puuid] = summoner
                        }
                        let new_players = []
                        for (let summoner of players) {
                            if (modified[summoner.puuid]) {
                                summoner.name = modified[summoner.puuid].name
                                new_players.push(summoner)
                            }
                        }
                        setPlayerNames(new_players)
                    })
                }
            })
        }
    }, [region, getTopPlayedWith, summoner_id])

    return (
        <div>
            <small>Over the past {recent_days} days.</small>
            <table className="table">
                <thead>
                    <tr>
                        <th>name</th>
                        <th>wins</th>
                        <th>games</th>
                    </tr>
                </thead>
                <tbody>
                    {player_names.map((player) => {
                        if (player.name) {
                            const win_perc = (player.wins / player.count) * 100
                            const win_perc_string = numeral(win_perc).format('0.0')
                            return (
                                <tr key={player.puuid}>
                                    <td>
                                        <a className="dark" href={getSummonerPageUrl(player.name)}>
                                            {player.name}
                                        </a>
                                    </td>
                                    <td>
                                        {player.wins} <small>{win_perc_string}%</small>
                                    </td>
                                    <td>{player.count}</td>
                                </tr>
                            )
                        } else {
                            return null
                        }
                    })}
                </tbody>
            </table>
        </div>
    )
}
