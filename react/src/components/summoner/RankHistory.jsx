import React, { useEffect, useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import api from '../../api/api'
import { AreaChart, XAxis, YAxis, Area, Tooltip, ReferenceLine } from 'recharts'
import moment from 'moment'


function RankHistory(props) {
    const [rank_data, setRankData] = useState([])
    const [show_queue, setShowQueue] = useState('RANKED_SOLO_5x5')
    const [modified_rank_data, setModifiedRankData] =  useState([])
    const [top_master_lp, setTopMasterLP] = useState(100)
    const [top_grandmaster_lp, setTopGrandMasterLP] = useState(100)
    const [top_challenger_lp, setTopChallengerLP] = useState(100)

    // eslint-disable-next-line
    const [four_div_tiers, setFourDivTiers] = useState([
        'IRON',
        'BRONZE',
        'SILVER',
        'GOLD',
        'PLATINUM',
        'DIAMOND',
    ])

    // eslint-disable-next-line
    const [one_div_tiers, setOneDivTiers] = useState([
        'MASTER',
        'GRANDMASTER',
        'CHALLENGER'
    ])

    const top_rank_lp = useMemo(() => {
        return {
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
    },
        [
            top_master_lp,
            top_grandmaster_lp,
            top_challenger_lp,
        ]
    )

    const calculateLinearRankNumber = useCallback((tier, division, lp) => {
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
            num = (4 * index) + div_number + add_lp
        }
        else if (one_div_tiers.indexOf(tier.toUpperCase()) >= 0) {
            let index = one_div_tiers.indexOf(tier.toUpperCase())
            let div_number = (four_div_tiers.length * 4) + (index * 4)
            let lp_number = (lp / top_rank_lp[tier.toLowerCase()].get) * 4
            num = div_number + lp_number
        }
        return num
    }, [top_rank_lp, one_div_tiers, four_div_tiers])

    // GET RANKED HISTORY DATA
    useEffect(() => {

        let data = {
            id: props.summoner.id,
            queue: show_queue,
            group_by: 'day',
        }
        api.player.getRankHistory(data)
            .then(response => {
                let d = response.data.data
                setRankData(d)
            })
    }, [props.summoner, show_queue])
    // console.log(rank_data)

    // SET TOP LP VALUES TO CORRECTLY SCALE
    useEffect(() => {

        let temp_master_lp
        let temp_grandmaster_lp
        let temp_challenger_lp
        for (let d of rank_data) {
            // console.log(d)
            let peak_rank = d.peak_rank
            if (one_div_tiers.indexOf(peak_rank.tier.toUpperCase()) >= 0) {
                let lp_value = peak_rank.league_points

                temp_master_lp = top_master_lp
                temp_grandmaster_lp = top_grandmaster_lp
                temp_challenger_lp = top_challenger_lp

                let tier = peak_rank.tier.toLowerCase()
                if (tier === 'master') {
                    if (lp_value > temp_master_lp) {
                        temp_master_lp = lp_value
                    }
                }
                else if (tier === 'grandmaster') {
                    if (lp_value > temp_grandmaster_lp) {
                        temp_grandmaster_lp = lp_value
                    }
                }
                else if (tier === 'challenger') {
                    if (lp_value > temp_challenger_lp) {
                        temp_challenger_lp = lp_value
                    }
                }
            }
        }

        if (temp_master_lp > top_master_lp) {
            setTopMasterLP(temp_master_lp)
        }
        if (temp_grandmaster_lp > top_grandmaster_lp) {
            setTopGrandMasterLP(temp_grandmaster_lp)
        }
        if (temp_challenger_lp > top_challenger_lp) {
            setTopChallengerLP(temp_challenger_lp)
        }

    }, [rank_data, top_rank_lp, one_div_tiers, top_master_lp, top_grandmaster_lp, top_challenger_lp])

    // MODIFY RANK DATA 
    useEffect(() => {
        let d = rank_data
        for (let i=0; i<d.length; i++) {
            let m = moment(d[i].start_date)
            d[i].epoch = m.unix() * 1000
            let peak = d[i].peak_rank
            let trough = d[i].trough_rank
            d[i].numeric_rank_peak = calculateLinearRankNumber(peak.tier, peak.division, peak.league_points)
            d[i].numeric_rank_trough = calculateLinearRankNumber(trough.tier, trough.division, trough.league_points)
            d[i].numeric_rank_range = [d[i].numeric_rank_trough, d[i].numeric_rank_peak]
        }
        setModifiedRankData(d)
    }, [rank_data, calculateLinearRankNumber, modified_rank_data])

    return (
        <div>

            <div style={{display: 'inline-block', verticalAlign: 'top'}}>
                <label htmlFor={`soloq-rank-selection`}>
                    <input id={`soloq-rank-selection`} onChange={useCallback(() => setShowQueue('RANKED_SOLO_5x5'), [])} type="radio" checked={show_queue === 'RANKED_SOLO_5x5'}/>
                    <span>Solo/Duo</span>
                </label>
                <div style={{width: 10}}></div>
                <label htmlFor={`flex-rank-selection`}>
                    <input id={`flex-rank-selection`} onChange={useCallback(() => setShowQueue('RANKED_FLEX_SR'), [])} type="radio" checked={show_queue === 'RANKED_FLEX_SR'}/>
                    <span>Flex</span>
                </label>
                <div style={{width: 10}}></div>
                <label htmlFor={`tft-rank-selection`}>
                    <input id={`tft-rank-selection`} onChange={useCallback(() => setShowQueue('RANKED_TFT'), [])} type="radio" checked={show_queue === 'RANKED_TFT'}/>
                    <span>TFT</span>
                </label>
            </div>

            {modified_rank_data.length > 1 &&
                <div style={{display: 'inline-block'}}>
                    <AreaChart
                        margin={{left: -20, top: 5}}
                        width={650}
                        height={200}
                        data={modified_rank_data}>

                        <XAxis
                            tickFormatter={(tick) => {
                                var m = moment(tick)
                                return `${m.format('ll')}`
                            }}
                            dataKey='epoch' />

                        {/*
                        */}
                        <YAxis
                            tick={false}
                            domain={['dataMin', 'dataMax']} />
                        <Area dataKey='numeric_rank_range' />

                        {[...four_div_tiers, ...one_div_tiers].map((tier, key) => {
                            if (key > 0) {
                                return (
                                    <ReferenceLine key={key} y={4 * (key)} label={`${tier}`} stroke="#ffffff" />
                                )
                            }
                            return null
                        })}

                        {four_div_tiers.map((tier, key) => {
                            return (
                                [
                                    <ReferenceLine key={`${key}-1`} y={(4 * key) + 1} stroke="#ffffff20" strokeDasharray="3 3" />,
                                    <ReferenceLine key={`${key}-2`} y={(4 * key) + 2} stroke="#ffffff20" strokeDasharray="3 3" />,
                                    <ReferenceLine key={`${key}-3`} y={(4 * key) + 3} stroke="#ffffff20" strokeDasharray="3 3" />
                                ]
                            )
                        })}

                        <Tooltip
                            formatter={(value, name, props) => {
                                // console.log(value)
                                let peak = props.payload.peak_rank
                                let trough = props.payload.trough_rank
                                let output = `${trough.tier.toUpperCase()} ${trough.division} ${trough.league_points} -to- ${peak.tier.toUpperCase()} ${peak.division} ${peak.league_points}`
                                return [output, 'Rank']
                            }}
                            labelFormatter={(label) => {
                                var m = moment(label)
                                return `${m.format('ll')}`
                            }}  />
                    </AreaChart>
                </div>
            }

            {modified_rank_data.length <= 1 &&
                <div style={{display: 'inline-block'}}>
                    <div style={{height: 20}}></div>
                    <span style={{
                        borderStyle: 'solid',
                        borderRadius: 5,
                        padding: 10,
                        marginLeft: 40,
                    }}>
                        No rank history saved.
                    </span>
                </div>
            }
        </div>
    )
}
RankHistory.propTypes = {
    summoner: PropTypes.object,
}

export default RankHistory