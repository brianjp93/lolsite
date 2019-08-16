import React, { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import api from '../../api/api'
import { AreaChart, XAxis, YAxis, Area, Tooltip } from 'recharts'
import moment from 'moment'


function RankHistory(props) {
    const [rank_data, setRankData] = useState([])
    const [top_master_lp, setTopMasterLP] = useState(100)
    const [top_grandmaster_lp, setTopGrandMasterLP] = useState(100)
    const [top_challenger_lp, setTopChallengerLP] = useState(100)

    const four_div_tiers = [
        'IRON',
        'BRONZE',
        'SILVER',
        'GOLD',
        'PLATINUM',
        'DIAMOND',
    ]
    const one_div_tiers = [
        'MASTER',
        'GRANDMASTER',
        'CHALLENGER'
    ]

    let top_rank_lp = {
        master: {
            get: top_master_lp,
            set: setTopMasterLP
        },
        grandmaster: {
            get: top_grandmaster_lp,
            set: setTopGrandMasterLP
        },
        challenger: {
            get: top_challenger_lp,
            set: setTopChallengerLP
        },
    }

    let calculateLinearRankNumber = useCallback((tier, division, lp) => {
        let num
        if (four_div_tiers.indexOf(tier.toUpperCase()) >= 0) {
            let index = four_div_tiers.indexOf(tier.toUpperCase())
            let div_number = ['IV', 'III', 'II', 'I'].indexOf(division.toUpperCase())
            let add_lp
            if (lp === 100) {
                add_lp = .9999
            }
            else {
                add_lp = lp / 100
            }
            num = 4 * index + div_number + add_lp
        }
        else if (one_div_tiers.indexOf(tier.toUpperCase()) >= 0) {
            let index = one_div_tiers.indexOf(tier.toUpperCase())
            let div_number = (four_div_tiers.length * 4) + (index * 4)
            let lp_number = (lp / top_rank_lp[tier.toLowerCase()].get) * 4
            num = div_number + lp_number
        }
        return num
    }, [one_div_tiers, four_div_tiers, top_rank_lp])

    // GET RANKED HISTORY DATA
    useEffect(() => {

        let data = {
            id: props.summoner.id,
            queue: 'RANKED_SOLO_5x5',
            group_by: 'week',
        }
        api.player.getRankHistory(data)
            .then(response => {
                let d = response.data.data
                for (let i=0; i<d.length; i++) {
                    let m = moment(d[i].start_date)
                    d[i].epoch = m.unix()
                    let peak = d[i].peak_rank
                    let trough = d[i].trough_rank
                    d[i].numeric_rank_peak = calculateLinearRankNumber(peak.tier, peak.division, peak.league_points)
                    d[i].numeric_rank_trough = calculateLinearRankNumber(trough.tier, trough.division, trough.league_points)
                    d[i].numeric_rank_range = [d[i].numeric_rank_trough, d[i].numeric_rank_peak]
                }
                setRankData(d)
            })
    }, [props.summoner])
    // console.log(rank_data)

    // SET TOP LP VALUES TO CORRECTLY SCALE
    useEffect(() => {
        for (let d of rank_data) {
            // console.log(d)
            let peak_rank = d.peak_rank
            if (one_div_tiers.indexOf(peak_rank.tier.toUpperCase()) >= 0) {
                if (peak_rank.league_points > top_rank_lp[peak_rank.tier.toLowerCase()].get) {
                    top_rank_lp[peak_rank.tier.toLowerCase()].set(peak_rank.league_points)
                }
            }
        }
    }, [rank_data, top_rank_lp, one_div_tiers])

    return (
        <div>
            <div style={{height: 15}}></div>
            <AreaChart
                margin={{left: 70, top: 5}}
                width={700}
                height={200}
                data={rank_data}>

                <XAxis
                    tickFormatter={(tickItem) => {
                        var m = moment(tickItem)
                        return `${m.format('ll')}`
                    }}
                    dataKey='epoch' />
                <YAxis
                    tickFormatter={(tick) => {
                        let all_tiers = [...four_div_tiers, ...one_div_tiers]
                        let tier_index = Math.floor(tick / 4)
                        let tier = all_tiers[tier_index]

                        if (tier === undefined) {
                            return ''
                        }

                        let division
                        let lp
                        if (tier_index >= 6) {
                            division = 'I'
                        }
                        else {
                            let div_index = Math.floor(tick) % 4
                            division = ['IV', 'III', 'II', 'I'][div_index]
                        }

                        if (tier_index >= 6 ) {
                            let top_lp = top_rank_lp[tier.toLowerCase()].get
                            lp = Math.round(((tick % 4) / 4) * top_lp)
                        }
                        else {
                            if (Math.round(10000 * (tick % 1)) === 9999) {
                                lp = 100
                            }
                            else {
                                lp = Math.round((tick % 1) * 100)
                            }
                        }
                        return `${tier} ${division} ${lp}LP`
                    }}
                    domain={['dataMin', 'dataMax']} />
                <Area dataKey='numeric_rank_range' />
                <Tooltip
                    formatter={(value, name, props) => {
                        console.log(value)
                        let peak = props.payload.peak_rank
                        let trough = props.payload.trough_rank
                        let output = `${trough.tier.toUpperCase()} ${trough.division} ${trough.league_points} to ${peak.tier.toUpperCase()} ${peak.division} ${peak.league_points}`
                        return [output, 'Rank']
                    }}
                    labelFormatter={(label) => {
                        var m = moment(label)
                        return `${m.format('ll')}`
                    }}  />
            </AreaChart>
        </div>
    )
}
RankHistory.propTypes = {
    summoner: PropTypes.object,
}

export default RankHistory