import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Tooltip, LineChart, Line, XAxis, YAxis, Legend } from 'recharts'
import { processItem } from '../items'
import { getStatCosts } from '../../../constants/general'
import api from '../../../api/api'
import { computeDamageMult, colors, computeArmorNegated } from './armorpencomparison'
import { axis_label } from '../itemstats'
import numeral from 'numeral'
import Slider from 'rc-slider'
import Latex from 'react-latex'

const stat_cost = getStatCosts()

export function EffectiveDamage(props) {
    const [items, setItems] = useState([])
    const [is_item_visible, setIsItemVisible] = useState({})
    const [start_crit, setStartCrit] = useState(0)
    const [start_pen, setStartPen] = useState(0)
    const [start_lethality, setStartLethality] = useState(0)
    const [start_ad, setStartAd] = useState(40)
    const [level, setLevel] = useState(11)
    const [has_ie, setHasIe] = useState(false)
    const [is_as_based, setIsAsBased] = useState(false)

    const height = props.height === undefined ? 200 : props.height
    const width = props.width === undefined ? 500 : props.width
    const style = props.style === undefined ? {} : props.style

    const data = useMemo(() => {
        let new_data = []
        for (let armor = 30; armor < 401; armor += 5) {
            let elt = { armor }
            for (let item of items) {
                if (is_item_visible[item.name]) {
                    let is_ie = item.name.toLowerCase() === 'infinity edge'
                    let ad_increase = item.stats.FlatPhysicalDamageMod
                    ad_increase = ad_increase === undefined ? 0 : ad_increase.value
                    let as_increase = item.stats.PercentAttackSpeedMod
                    as_increase = as_increase === undefined ? 0 : as_increase.value
                    let lethality_increase = item.stats.Lethality
                    lethality_increase =
                        lethality_increase === undefined ? 0 : lethality_increase.value
                    let pen_increase = item.stats.ArmorPen
                    pen_increase = pen_increase === undefined ? 0 : pen_increase.value
                    let crit_increase = item.stats.FlatCritChanceMod
                    crit_increase = crit_increase === undefined ? 0 : crit_increase.value
                    let dmg_increase = computeDamageIncrease(
                        start_ad,
                        ad_increase,
                        start_pen,
                        pen_increase,
                        start_lethality,
                        lethality_increase,
                        armor,
                        start_crit,
                        crit_increase,
                        level,
                        has_ie || is_ie,
                    )
                    if (is_as_based) {
                        dmg_increase = computeDamageIncreaseAutoBased(dmg_increase, as_increase)
                    }
                    elt[item.name] = (dmg_increase / item.gold.total) * 1000
                } else {
                    elt[item.name] = null
                }
            }
            new_data.push(elt)
        }
        return new_data
    }, [
        items,
        is_item_visible,
        start_crit,
        start_pen,
        start_lethality,
        start_ad,
        level,
        has_ie,
        is_as_based,
    ])

    const getItems = useCallback(() => {
        let params = {
            item_list: [
                3812,
                3072,
                3074,
                3031,
                3153,
                3508,
                3095,
                3181,
                3142,
                3147,
                3036,
                3179,
                3035,
                1038,
                3134,
                3085,
                3086,
            ],
        }
        return api.data.getItem(params)
    }, [])

    const handleLegendClick = event => {
        let new_is_visible = { ...is_item_visible }
        new_is_visible[event.dataKey] = !new_is_visible[event.dataKey]
        setIsItemVisible(new_is_visible)
    }

    useEffect(() => {
        getItems().then(response => {
            let new_items = []
            let new_is_visible = {}
            for (let item of response.data.data) {
                new_items.push(processItem(item, stat_cost))
                new_is_visible[item.name] = true
            }
            setItems(new_items)
            setIsItemVisible(new_is_visible)
        })
    }, [getItems])

    const slider_div = { display: 'inline-block', width: '70%' }
    const label_style = { display: 'inline-block', width: '30%', textAlign: 'right' }

    return (
        <div
            className="legend-click"
            style={{ ...style, paddingRight: 10, paddingLeft: 10 }}
        >
            <div className='unselectable'>
                {data.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        <LineChart width={width} height={height} data={data}>
                            <XAxis
                                label={{
                                    style: axis_label,
                                    value: 'Enemy Armor',
                                    position: 'insideBottom',
                                    offset: -5,
                                }}
                                dataKey="armor"
                            ></XAxis>
                            <YAxis
                                label={{
                                    value: 'Effective Damage per 1,000 Gold',
                                    position: 'insideBottomLeft',
                                    offset: 20,
                                    style: axis_label,
                                    angle: -90,
                                }}
                            ></YAxis>
                            <Tooltip
                                wrapperStyle={{ zIndex: 10 }}
                                labelFormatter={label => {
                                    return `${label} Enemy Armor`
                                }}
                                formatter={(value, name) => {
                                    return [numeral(value).format('0.00'), name]
                                }}
                                itemSorter={item => -item.value}
                            />
                            <Legend wrapperStyle={{ paddingTop: 5 }} onClick={handleLegendClick} />
                            {items.map((item, key) => {
                                return (
                                    <Line
                                        type="monotone"
                                        legendType={
                                            is_item_visible[item.name] ? 'square' : 'plainline'
                                        }
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

                <div className="row">
                    <div className="col s6">
                        <button
                            style={{ width: '100%' }}
                            onClick={() => {
                                let new_is_visible = { ...is_item_visible }
                                for (let key in new_is_visible) {
                                    new_is_visible[key] = false
                                }
                                setIsItemVisible(new_is_visible)
                            }}
                            className={`${props.theme} btn`}
                        >
                            deselect all
                        </button>
                    </div>
                    <div className="col s6">
                        <button
                            style={{ width: '100%' }}
                            onClick={() => {
                                let new_is_visible = { ...is_item_visible }
                                for (let key in new_is_visible) {
                                    new_is_visible[key] = true
                                }
                                setIsItemVisible(new_is_visible)
                            }}
                            className={`${props.theme} btn`}
                        >
                            select all
                        </button>
                    </div>
                </div>

                <div style={{ ...slider_div }}>
                    <Slider value={start_ad} onChange={setStartAd} min={0} max={300} />
                </div>
                <div style={{ ...label_style }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {start_ad}
                    </span>{' '}
                    <span>Initial AD</span>
                </div>

                <div style={{ ...slider_div }}>
                    <Slider
                        value={start_crit}
                        onChange={setStartCrit}
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </div>
                <div style={{ ...label_style }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {numeral(start_crit * 100).format('0')}%
                    </span>{' '}
                    <span> Crit</span>
                </div>

                <div style={{ ...slider_div }}>
                    <Slider value={start_pen} onChange={setStartPen} min={0} max={1} step={0.01} />
                </div>
                <div style={{ ...label_style }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {numeral(start_pen * 100).format('0')}%
                    </span>{' '}
                    <span> Armor Pen</span>
                </div>

                <div style={{ ...slider_div }}>
                    <Slider value={level} onChange={setLevel} min={1} max={18} />
                </div>
                <div style={{ ...label_style }}>
                    <span>level </span>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{level}</span>
                </div>

                <div style={{ ...slider_div }}>
                    <Slider value={start_lethality} onChange={setStartLethality} min={0} max={60} />
                </div>
                <div style={{ ...label_style }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {start_lethality}
                    </span>
                    <span> lethality</span>
                </div>

                <div style={{ display: 'inline-block' }}>
                    <p
                        style={{
                            padding: '0px 15px 0px 0px',
                            borderRadius: 6,
                            background: '#2828285e',
                            margin: '5px 0px',
                            display: 'inline-block',
                        }}
                    >
                        <label>
                            <input
                                checked={has_ie}
                                type="checkbox"
                                onChange={() => {
                                    setHasIe(!has_ie)
                                }}
                            />
                            <span>has Infinity Edge</span>
                        </label>
                    </p>
                </div>
                <div style={{ display: 'inline-block', marginLeft: 8 }}>
                    <p
                        style={{
                            padding: '0px 15px 0px 0px',
                            borderRadius: 6,
                            background: '#2828285e',
                            margin: '5px 0px',
                            display: 'inline-block',
                        }}
                    >
                        <label>
                            <input
                                checked={is_as_based}
                                type="checkbox"
                                onChange={() => {
                                    setIsAsBased(!is_as_based)
                                }}
                            />
                            <span>auto based</span>
                        </label>
                    </p>
                </div>
            </div>

            <div>
                <div>
                    Here, I am calculating effective damage by applying armor pen and then lethality
                    to the enemy's armor. Then assume <Latex>$$1AD = 1\ Physical\ Damage$$</Latex>.
                    Then we apply the average damage of crit such that
                    <Latex displayMode>{`$$avg\\ dmg = dmg \\times (1 + Crit\\ Chance)$$`}</Latex>
                    If <b>has Infinity Edge</b> is selected, crit damage is increased by 25%, except
                    for IE which always has the multiplier applied
                    <Latex displayMode>
                        {`$$avg\\ dmg = dmg \\times (1 + (Crit\\ Chance \\times 1.25))$$`}
                    </Latex>
                    If <b>auto based</b> is selected, it is assumed that attack speed will affect
                    damage output linearly. This should be selected for most ADCs and other
                    champions whose damage comes largely from autoing.
                    <Latex displayMode>{`$$avg\\ dmg = dmg \\times (1 + AS)$$`}</Latex>
                </div>
            </div>
        </div>
    )
}

function computeDamageIncrease(
    start_ad,
    increase_ad,
    start_pen,
    pen_increase,
    lethality,
    lethality_increase,
    enemy_armor,
    start_crit,
    crit_increase,
    level,
    has_ie,
) {
    const new_ad = start_ad + increase_ad
    const new_lethality = lethality + lethality_increase
    let new_crit = start_crit + crit_increase
    let crit_mult = 1
    // if has ie and crit > 60% then crit mult is 1.35
    if (new_crit >= .6 && has_ie) {
        crit_mult = 1.35
    }
    new_crit = new_crit > 1 ? 1 : new_crit
    const new_pen = pen_increase + start_pen
    const initial_armor =
        enemy_armor - computeArmorNegated(enemy_armor, lethality, start_pen, level)
    const inital_dmg_mult = computeDamageMult(initial_armor)
    const initial_physical_dmg = inital_dmg_mult * start_ad * (crit_mult * start_crit + 1)

    const new_armor = enemy_armor - computeArmorNegated(enemy_armor, new_lethality, new_pen, level)
    const new_dmg_mult = computeDamageMult(new_armor)
    const new_physical_dmg = new_dmg_mult * new_ad * (crit_mult * new_crit + 1)
    return new_physical_dmg - initial_physical_dmg
}

function computeDamageIncreaseAutoBased(dmg_increase, as_increase) {
    return dmg_increase * (1 + as_increase)
}
