import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'
import api from '../../../api/api'
import { processItem } from '../items'
import { getStatCosts } from '../../../constants/general'

const stat_cost = getStatCosts()

export function ArmorPenComparison(props) {
    const [items, setItems] = useState([])
    const [is_item_visible, setIsItemVisible] = useState({})

    const level = props.level === undefined ? 11: props.level
    const height = props.height
    const width = props.width

    const getItems = useCallback(() => {
        const item_list = [3033, 3036, 3035, 3181, 3142, 3147, 3388, 3814, 3179, 3134]
        const data = { item_list }
        return api.data.getItem(data)
    }, [])

    const colors = [
        '#3251a8',
        '#3632a8',
        '#5d32a8',
        '#8732a8',
        '#911c49',
        '#ad2643',
        '#ad262b',
        '#a84a32',
        '#c97340',
        '#c99940',
    ]

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
                    elt[item.name] = computeArmorNegated(armor, lethality, armorpen, level)
                }
                else {
                    elt[item.name] = null
                }
            }
            new_data.push(elt)
        }
        return new_data
    }, [items, level, is_item_visible])

    const handleLegendClick = (event) => {
        let new_is_visible = {...is_item_visible}
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
                <div className='unselectable'>
                    <LineChart height={height} width={width} data={data}>
                        <XAxis dataKey="armor" />
                        <YAxis />
                        <Legend onClick={handleLegendClick} />
                        <CartesianGrid strokeDasharray="5 5" strokeOpacity={0.3} />
                        {items.map((item, key) => {
                            return (
                                <Line
                                    legendType={is_item_visible[item.name] ? 'line': 'triangle'}
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
                </div>
            )}
        </>
    )
}

function computeArmorNegated(armor, lethality, armor_pen_percent, level) {
    armor = armor === undefined ? 0 : armor
    lethality = lethality === undefined ? 0 : lethality
    armor_pen_percent = armor_pen_percent === undefined ? 0 : armor_pen_percent
    level = level === undefined ? 0 : level

    const original_armor = armor
    const original_dmg_mult = computeDamageMult(original_armor)
    const leth_cut = lethality * (0.6 + (0.4 * level) / 18)
    armor -= leth_cut
    const armor_pen_percent_cut = armor * armor_pen_percent
    armor -= armor_pen_percent_cut
    const dmg_mult = computeDamageMult(armor)

    return (dmg_mult / original_dmg_mult - 1) * 100
}

function computeDamageMult(armor) {
    if (armor >= 0) {
        return 100 / (100 + armor)
    } else {
        return 2 - 100 / (100 - armor)
    }
}
