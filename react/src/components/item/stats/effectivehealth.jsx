import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, } from 'recharts'
import Slider from 'rc-slider'
import numeral from 'numeral'
import api from '../../../api/api'
import { colors } from './armorpencomparison'
import { axis_label } from '../itemstats'

// compute and show effective health per gold for some items
export function EffectiveHealth(props) {
    const [items, setItems] = useState([])
    const [is_item_visible, setIsItemVisible] = useState({})
    const [armor_mr, setArmorMR] = useState(50)
    const [with_cinder_hulk, setWithCinderHulk] = useState(false)

    const height = props.height === undefined ? 200 : props.height
    const width = props.width === undefined ? 200 : props.width

    const getItems = useCallback(() => {
        let temp = {
            item_list: [3075, 3143, 3742, 3068, 3800, 3109, 3001, 3065, 3194, 3211],
        }
        return api.data.getItem(temp)
    }, [])

    const data = useMemo(() => {
        let new_data = []
        for (let health = 1000; health <= 3000; health += 20) {
            let elt = { health }
            for (let item of items) {
                if (is_item_visible[item.name]) {
                    let armor = item.stats.FlatArmorMod
                    let mr = item.stats.FlatSpellBlockMod
                    let defense = armor === undefined ? mr : armor
                    elt[item.name] =
                        1 /
                        computeGoldPerEffectiveHealth(
                            item.gold.total,
                            health,
                            armor_mr,
                            item.stats.FlatHPPoolMod,
                            defense,
                            with_cinder_hulk,
                        )
                } else {
                    elt[item.name] = null
                }
            }
            new_data.push(elt)
        }
        return new_data
    }, [items, armor_mr, is_item_visible, with_cinder_hulk])

    const handleLegendClick = event => {
        let new_is_visible = { ...is_item_visible }
        new_is_visible[event.dataKey] = !new_is_visible[event.dataKey]
        setIsItemVisible(new_is_visible)
    }

    useEffect(() => {
        getItems().then(response => {
            let new_is_item_visible = {}
            for (let item of response.data.data) {
                new_is_item_visible[item.name] = true
            }
            setIsItemVisible(new_is_item_visible)
            setItems(response.data.data)
        })
    }, [getItems])

    const slider_div = { display: 'inline-block', width: '70%' }
    const label_style = { display: 'inline-block', width: '30%', textAlign: 'right' }

    return (
        <div className='legend-click'>
            {data.length > 0 && (
                <div style={{position: 'relative'}}>
                    <LineChart width={width} height={height} data={data}>
                        <XAxis
                            label={{
                                style: axis_label,
                                value: 'Current Health',
                                position: 'insideBottom',
                                offset: -5,
                            }}
                            dataKey="health" >
                        </XAxis>
                        <YAxis
                            label={{
                                value: 'Effective Health per Gold',
                                position: 'insideBottomLeft',
                                offset: 20,
                                style: axis_label,
                                angle: -90,
                            }}
                            domain={[0, 'auto']} >
                        </YAxis>
                        <Tooltip
                            labelFormatter={label => {
                                return `${label} Health`
                            }}
                            formatter={(value, name) => {
                                return [numeral(value).format('0.00'), name]
                            }}
                            itemSorter={item => -item.value}
                        />
                        <Legend
                            wrapperStyle={{paddingTop: 5}}
                            onClick={handleLegendClick} />
                        {items.map((item, key) => {
                            return (
                                <Line
                                    type="monotone"
                                    legendType={is_item_visible[item.name] ? 'square' : 'plainline'}
                                    stroke={colors[key]}
                                    dot={false}
                                    key={item._id}
                                    dataKey={item.name}
                                    strokeWidth={2}
                                />
                            )
                        })}
                    </LineChart>
                </div>
            )}

            {items.length > 0 &&
                <div style={{marginBottom: 10}}>
                    <small>
                        *Based on stat values from patch {items[0].version}
                    </small>
                    <br />
                    <small>
                        *Effective health is assuming damage taken from the type it is blocking
                        <ul style={{paddingLeft: 20}}>
                            <li style={{listStyleType: 'circle'}}>
                                For example, Spectre's Cowl could give 1.8 effective health / gold
                                against AP, but would be less gold efficient against AD
                                as it does not give armor.
                            </li>
                        </ul>
                    </small>
                </div>
            }
            <div style={{ ...slider_div }}>
                <Slider value={armor_mr} onChange={setArmorMR} min={30} max={300} />
            </div>
            <div style={{ ...label_style }}>
                <span style={{fontWeight: 'bold', textDecoration: 'underline'}}>
                    {armor_mr}
                </span>
                {' '}
                <span>
                    Armor or MR
                </span>
            </div>

            <div>
                <p
                    style={{
                        padding: '0px 15px 0px 0px',
                        borderRadius: 6,
                        background: '#2828285e',
                        margin: '5px 0px',
                        display: 'inline-block' }}>
                    <label>
                        <input
                            checked={with_cinder_hulk}
                            type="checkbox"
                            onChange={() => {
                                setWithCinderHulk(!with_cinder_hulk)
                            }}
                        />
                        <span>with cinderhulk</span>
                    </label>
                </p>
            </div>
        </div>
    )
}

function computeEffectiveHealth(health, armor_mr) {
    return (1 + armor_mr / 100) * health
}

function computeGoldPerEffectiveHealth(
    gold,
    current_health,
    current_armor_mr,
    health_added,
    armor_mr_added,
    with_cinder_hulk
) {
    const current_effective_health = computeEffectiveHealth(current_health, current_armor_mr)
    let new_health = current_health + health_added
    if (with_cinder_hulk === true) {
        new_health = 1.15 * new_health
    }
    const new_armor_mr = current_armor_mr + armor_mr_added
    const new_effective_health = computeEffectiveHealth(new_health, new_armor_mr)
    return gold / (new_effective_health - current_effective_health)
}
