import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Tooltip, LineChart, Line, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'
import api from '../../../api/api'
import { processItem } from '../items'
import { getStatCosts } from '../../../constants/general'
import { axis_label } from '../itemstats'
import numeral from 'numeral'

const stat_cost = getStatCosts()

export const colors = [
    '#3632a8',
    '#5d32a8',
    '#8732a8',
    '#911c49',
    '#ad2643',
    '#ad262b',
    '#a84a32',
    '#c97340',
    '#c99940',
    '#e03528',
    '#5e130d',
    '#877651',
    '#ffb81c',
    '#86d1f7',
    '#13435c',
    '#5a135c',
    '#d979db',
    '#301a22',
    '#6da66f',
]

export function ArmorPenComparison(props) {
    const [items, setItems] = useState([])
    const [is_item_visible, setIsItemVisible] = useState({})

    const level = props.level === undefined ? 11 : props.level
    const height = props.height
    const width = props.width

    const getItems = useCallback(() => {
        const item_list = [3036, 3035, 3181, 3142, 3147, 3388, 3814, 3179, 3134]
        const data = { item_list }
        return api.data.getItem(data)
    }, [])

    const data = useMemo(() => {
        let new_data = []
        let lethality
        let armorpen
        for (let armor = 0; armor < 300; armor += 4) {
            let elt = { armor }
            for (let item of items) {
                if (is_item_visible[item.name]) {
                    lethality = item.stats.Lethality === undefined ? 0 : item.stats.Lethality.value
                    armorpen = item.stats.ArmorPen === undefined ? 0 : item.stats.ArmorPen.value
                    elt[item.name] = computePercentDamageIncrease(armor, lethality, armorpen, level)
                } else {
                    elt[item.name] = null
                }
            }
            new_data.push(elt)
        }
        return new_data
    }, [items, level, is_item_visible])

    const handleLegendClick = event => {
        let new_is_visible = { ...is_item_visible }
        new_is_visible[event.dataKey] = !new_is_visible[event.dataKey]
        setIsItemVisible(new_is_visible)
    }

    useEffect(() => {
        getItems().then(response => {
            let new_items = []
            let is_visible = {}
            for (let item of response.data.data) {
                new_items.push(processItem(item, stat_cost))
                is_visible[item.name] = true
            }
            setItems(new_items)
            setIsItemVisible(is_visible)
        })
    }, [getItems])

    return (
        <>
            {data.length > 0 && (
                <div className="unselectable legend-click">
                    <LineChart height={height} width={width} data={data}>
                        <XAxis
                            label={{
                                value: 'Armor / MR',
                                position: 'insideBottom',
                                style: axis_label,
                                offset: -8,
                            }}
                            dataKey="armor"
                        />
                        <YAxis
                            label={{
                                value: '% DMG Increase',
                                position: 'insideBottomLeft',
                                angle: -90,
                                style: axis_label,
                                offset: 30,
                            }}
                        />
                        <Tooltip
                            labelFormatter={label => {
                                return `${label} armor`
                            }}
                            formatter={(value, name) => {
                                return [numeral(value).format('0.00'), name]
                            }}
                            itemSorter={item => -item.value}
                            wrapperStyle={{ zIndex: 10 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 12 }} onClick={handleLegendClick} />
                        <CartesianGrid strokeDasharray="5 5" strokeOpacity={0.3} />
                        {items.map((item, key) => {
                            return (
                                <Line
                                    legendType={is_item_visible[item.name] ? 'square' : 'plainline'}
                                    strokeWidth={2}
                                    key={item._id}
                                    dot={false}
                                    stroke={colors[key]}
                                    type="monotone"
                                    dataKey={item.name}
                                />
                            )
                        })}
                    </LineChart>
                    {items.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                            <small>*Based on stat values from patch {items[0].version}</small>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export function computePercentDamageIncrease(armor, lethality, armor_pen_percent, level) {
    armor = armor === undefined ? 0 : armor
    lethality = lethality === undefined ? 0 : lethality
    armor_pen_percent = armor_pen_percent === undefined ? 0 : armor_pen_percent
    level = level === undefined ? 1 : level

    const original_armor = armor
    const original_dmg_mult = computeDamageMult(original_armor)
    const leth_cut = lethality * (0.6 + (0.4 * level / 18))
    armor -= leth_cut
    const armor_pen_percent_cut = armor * armor_pen_percent
    armor -= armor_pen_percent_cut
    const dmg_mult = computeDamageMult(armor)

    return (dmg_mult / original_dmg_mult - 1) * 100
}

export function computeArmorNegated(armor, lethality, armor_pen_percent, level) {
    armor = armor === undefined ? 0 : armor
    const original_armor = armor
    lethality = lethality === undefined ? 0 : lethality
    armor_pen_percent = armor_pen_percent === undefined ? 0 : armor_pen_percent
    level = level === undefined ? 1 : level

    const leth_cut = lethality * (0.6 + (0.4 * level / 18))
    armor -= leth_cut
    armor = armor * (1 - armor_pen_percent)
    return original_armor - armor
}

export function computeDamageMult(armor) {
    if (armor >= 0) {
        return 100 / (100 + armor)
    } else {
        return 2 - 100 / (100 - armor)
    }
}
