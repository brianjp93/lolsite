import React, { useState, useEffect, useCallback } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import fuzzysearch from 'fuzzysearch'
import LazyLoad from 'react-lazyload'
import numeral from 'numeral'
import { getStatCosts, stripHtml } from '../../constants/general'
import Orbit from '../general/spinners/orbit'

export function ItemsPage(props) {
    return (
        <Skeleton store={props.store} route={props.route}>
            <div className="container">
                <ItemsGrid {...props} />
            </div>
        </Skeleton>
    )
}

function sortItems(items, order_by) {
    items.sort((a, b) => {
        if (order_by === '-gold') {
            return b.gold.total - a.gold.total
        } else if (order_by === '+gold') {
            return a.gold.total - b.gold.total
        }
        return null
    })
    return items
}

function generalFilter(items) {
    items = items.filter(item => {
        let champions = ['Sylas', 'Kalista', 'Gangplank', 'FiddleSticks']
        if (champions.indexOf(item.required_champion) >= 0) {
            return false
        } else if (item.name.indexOf('Quick Charge') >= 0) {
            return false
        } else if (item.name.indexOf('Enchantment:') >= 0) {
            if (item.gold.total < 2000) {
                return false
            }
        }
        return true
    })
    return items
}

function filterStats(items, stat_set) {
    return items.filter(item => {
        for (let stat of stat_set) {
            if (item.stats[stat] === undefined) {
                return false
            }
        }
        return true
    })
}

const stat_name = {
    PercentAttackSpeedMod: ['AS', 'Attack Speed'],
    FlatMPPoolMod: ['Mana', 'Mana'],
    FlatHPPoolMod: ['HP', 'Health'],
    PercentMovementSpeedMod: ['MS%', 'Percent Movement Speed'],
    FlatPhysicalDamageMod: ['AD', 'Attack Damage'],
    FlatMagicDamageMod: ['AP', 'Ability Power'],
    FlatArmorMod: ['Armor', 'Armor'],
    FlatSpellBlockMod: ['MR', 'Magic Resist'],
    PercentLifeStealMod: ['LS', 'Life Steal'],
    FlatCritChanceMod: ['Crit', 'Crit Chance'],
    FlatHPRegenMod: ['HP Regen', 'Flat Health Regeneration'],
    FlatMovementSpeedMod: ['Flat MS', 'Flat Movement Speed'],
    BaseManaRegen: ['Mana Regen', 'Base Mana Regen'],
    Lethality: ['Leth', 'Lethality'],
    ArmorPen: ['Armor Pen', '% Armor Penetration'],
    MagicPen: ['% Pen', 'Percent Magic Penetration'],
    FlatMagicPen: ['Flat Pen', 'Flat Magic Penetration'],
    CooldownReduction: ['CDR', 'Cooldown Reduction'],
    HealAndShieldPower: ['H+S', 'Heal and Shield Power'],
    PercentBaseHPRegen: ['Base Regen', 'Base Health Regen Percentage'],
    Haste: ['Haste', 'Ability Haste'],
}
function convertStatName(name) {
    if (stat_name[name] !== undefined) {
        return stat_name[name]
    }
    return [name, name]
}

export function ItemsGrid(props) {
    const [items, setItems] = useState([])
    const [sortedItems, setSortedItems] = useState([])
    const [order_by, setOrderBy] = useState('-gold')
    const [search, setSearch] = useState('')
    const [has_stats, setHasStats] = useState(new Set())
    const [is_requesting_items, setIsRequesingItems] = useState(false)

    const map_id = 11

    const theme = props.store.state.theme

    function getItems() {
        setIsRequesingItems(true)
        api.data.items().then(response => {
            setItems(response.data.data)
            setIsRequesingItems(false)
        })
    }

    const statCheckbox = useCallback(
        (stat_name, label) => {
            return (
                <p style={{ margin: '5px 0px' }}>
                    <label>
                        <input
                            checked={has_stats.has(stat_name)}
                            type="checkbox"
                            onChange={() => {
                                let new_set = new Set(has_stats)
                                if (new_set.has(stat_name)) {
                                    new_set.delete(stat_name)
                                } else {
                                    new_set.add(stat_name)
                                }
                                setHasStats(new_set)
                            }}
                        />
                        <span>{label}</span>
                    </label>
                </p>
            )
        },
        [has_stats],
    )

    useEffect(() => {
        getItems()
    }, [])

    useEffect(() => {
        window.scrollTo(window.scrollX, window.scrollY - 1)
        window.scrollTo(window.scrollX, window.scrollY + 1)
    }, [sortedItems])

    useEffect(() => {
        if (items !== undefined && items.length > 0) {
            let new_items = sortItems(items, order_by)
            // filter map
            new_items = new_items.filter(item => item.maps[map_id] && item.gold.purchasable)
            // filter purchasable
            // new_items = new_items.filter(item => item.gold.purchasable)
            // general filter
            new_items = generalFilter(new_items)
            new_items = filterStats(new_items, has_stats)
            setSortedItems(new_items)
        }
    }, [items, order_by, map_id, has_stats])

    const checkbox_style = {
        display: 'inline-block',
        verticalAlign: 'top',
    }

    return (
        <div>
            <div style={checkbox_style}>
                {statCheckbox('FlatPhysicalDamageMod', 'Attack Damage')}
                {statCheckbox('PercentAttackSpeedMod', 'Attack Speed')}
                {statCheckbox('FlatCritChanceMod', 'Crit Chance')}
                {statCheckbox('PercentLifeStealMod', 'Life Steal')}
                {statCheckbox('Lethality', 'Lethality')}
                {statCheckbox('ArmorPen', 'Armor Penetration %')}
            </div>

            <div style={checkbox_style}>
                {statCheckbox('FlatMagicDamageMod', 'Ability Power')}
                {statCheckbox('MagicPen', '% Magic Pen')}
                {statCheckbox('FlatMagicPen', 'Flat Magic Pen')}
                {statCheckbox('FlatMPPoolMod', 'Mana')}
                {statCheckbox('CooldownReduction', 'Cooldown Reduction')}
            </div>

            <div style={checkbox_style}>
                {statCheckbox('FlatHPPoolMod', 'Health')}
                {statCheckbox('FlatHPRegenMod', 'Flat HP Regen')}
                {statCheckbox('PercentBaseHPRegen', '% Base HP Regen')}
                {statCheckbox('BaseManaRegen', 'Base Mana Regen')}
            </div>

            <div style={checkbox_style}>
                {statCheckbox('FlatArmorMod', 'Armor')}
                {statCheckbox('FlatSpellBlockMod', 'Magic Resist')}

                {statCheckbox('HealAndShieldPower', 'Heal and Shield Power')}
                {statCheckbox('FlatMovementSpeedMod', 'Flat Movement Speed')}
                {statCheckbox('PercentMovementSpeedMod', '% Movement Speed')}
            </div>

            <div className="row">
                <div className="col s8">
                    <div className="input-field">
                        <input
                            id="item-search-field"
                            className={theme}
                            type="text"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                        />
                        <label htmlFor="item-search-field">Item Filter</label>
                    </div>
                </div>

                <div className="col s4">
                    <div className={`input-field ${theme}`}>
                        <select
                            ref={elt => window.$(elt).formSelect()}
                            onChange={event => setOrderBy(event.target.value)}
                        >
                            {['-gold', '+gold'].map(elt => {
                                return (
                                    <option key={elt} value={elt}>
                                        {elt}
                                    </option>
                                )
                            })}
                        </select>
                        <label>Sort By</label>
                    </div>
                </div>
            </div>

            {is_requesting_items && (
                <div>
                    <Orbit style={{ margin: 'auto' }} size={300} />
                </div>
            )}
            {!is_requesting_items && (
                <ItemsGridDisplay search={search} theme={theme} items={sortedItems} />
            )}
        </div>
    )
}

function ItemsGridDisplay(props) {
    const items = props.items
    const theme = props.theme
    const search = props.search

    useEffect(() => {
        window.scrollTo(window.scrollX, window.scrollY - 1)
        window.scrollTo(window.scrollX, window.scrollY + 1)
    }, [props.search])
    return (
        <div>
            <div className="row">
                {items
                    .filter(item => fuzzysearch(search, item.name.toLowerCase()))
                    .map(item => {
                        return (
                            <div key={`${item._id}-${item.version}`} className="col m3">
                                <Item theme={theme} item={item} />
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}

export function processItem(item, stat_costs) {
    item = { ...item }
    item.notes = []
    let x

    let description = stripHtml(item.description)

    x = description.match(/([0-9]+)% Base Mana Regen/)
    if (x !== null) {
        item.stats.BaseManaRegen = parseFloat(x[1])
    }

    x = description.match(/([0-9]+) Lethality/)
    if (x !== null) {
        item.stats.Lethality = parseFloat(x[1])
    }

    // Ability Haste
    x = description.match(/([0-9]+) Ability Haste/)
    if (x !== null) {
        item.stats.Haste = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+)% Magic Penetration/)
    if (x !== null) {
        item.stats.MagicPen = parseFloat(x[1])
        item.notes.push(
            'The value of % Magic Pen is highly dependent on the amount of Magic Resist the enemy team has.',
        )
    }

    if (item.name.indexOf("Rabadon's") >= 0) {
        try {
            x = item.description.match(/Increases.*Ability Power by ([0-9]+)%/)
            let mult = parseInt(x[1]) / 100 + 1
            let ap = item.stats.FlatMagicDamageMod
            let total = numeral(mult * ap).format('0')
            item.notes.push(
                `This item technically gives ${ap} x ${mult} = ${total} AP.  Making it worth considerably more.`,
            )
        } catch (error) {}
    }

    x = description.match(/\+([0-9]+) Magic Penetration/)
    if (x !== null) {
        item.stats.FlatMagicPen = parseFloat(x[1]) / 100
    }

    x = description.match(/\+([0-9]+)% Cooldown Reduction/)
    if (x !== null) {
        item.stats.CooldownReduction = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+)% Heal and Shield Power/)
    if (x !== null) {
        item.stats.HealAndShieldPower = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+)% Base Health Regen/)
    if (x !== null) {
        item.stats.PercentBaseHPRegen = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+)% Life Steal/)
    if (x !== null) {
        item.stats.PercentLifeStealMod = parseFloat(x[1]) / 100
    }

    x = description.match(/([0-9]+)% Armor Penetration/)
    if (x !== null) {
        item.stats.ArmorPen = parseFloat(x[1]) / 100
        item.notes.push(
            'Armor Pen efficiency is calculated against an enemy with 100 armor.  Champion BASE armor starts at ~25 armor at level one and increases to ~100 armor at level 18.',
        )
    }

    for (let stat_name in item.stats) {
        let value = item.stats[stat_name]
        item.stats = { ...item.stats }
        item.stats[stat_name] = {
            value,
            gold_value: stat_costs[stat_name] * value,
        }
    }
    return item
}

export function Item(props) {
    const [item, setItem] = useState({})
    const theme = props.theme
    const sidepad = 10

    let stat_cost = null
    let stat_efficiency = null
    let sell_efficiency = null
    if (item.stats !== undefined && Object.keys(item.stats).length > 0) {
        stat_cost = Object.keys(item.stats).reduce(
            (total, x) => total + item.stats[x].gold_value,
            0,
        )
        stat_efficiency = item.gold.total === 0 ? 0 : stat_cost / item.gold.total
        sell_efficiency = item.gold.total === 0 ? 0 : item.gold.sell / item.gold.total
    }

    useEffect(() => {
        if (props.item !== undefined && Object.keys(props.item).length > 0) {
            setItem(processItem(props.item, getStatCosts()))
        }
    }, [props.item])

    const label_style = { borderRadius: 4, padding: '0px 4px', display: 'inline-block' }
    const card_height = 300
    return (
        <LazyLoad offset={200} height={card_height}>
            <div
                style={{
                    height: card_height,
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    paddingTop: 0,
                    paddingRight: sidepad,
                    paddingLeft: sidepad,
                    position: 'relative',
                }}
                className={`quiet-scroll card-panel ${theme}`}
            >
                {Object.keys(item).length > 0 && (
                    <React.Fragment>
                        <h6
                            style={{
                                marginBottom: 0,
                                fontWeight: 'bold',
                            }}
                        >
                            <img
                                style={{
                                    marginRight: 7,
                                    height: 40,
                                    borderRadius: 8,
                                    position: 'absolute',
                                    right: 0,
                                    top: 8,
                                }}
                                src={item.image_url}
                                alt=""
                            />
                            <div
                                style={{
                                    width: '70%',
                                    display: 'inline-block',
                                }}
                            >
                                {item.name}
                            </div>
                        </h6>
                        <div
                            style={{
                                fontWeight: 'bold',
                                background: '#28314a',
                                padding: 5,
                                borderRadius: 5,
                                marginTop: 5,
                            }}
                        >
                            <small>
                                <div style={{ color: '#f5e15e' }}>{item.gold.total}g</div>

                                <div>
                                    <div style={{ ...label_style, background: '#471d4e' }}>
                                        {numeral(stat_cost).format('0,0')}
                                    </div>
                                    <span> gold value at </span>
                                    <div
                                        style={{
                                            ...label_style,
                                            background: '#437396',
                                            color: 'white',
                                        }}
                                    >
                                        {numeral(stat_efficiency * 100).format('0')}%
                                    </div>
                                    <span> efficiency</span>
                                </div>
                                <div style={{ marginTop: 3 }}>
                                    <div style={{ ...label_style, background: '#471d4e' }}>
                                        {numeral(item.gold.sell).format('0,0')}
                                    </div>
                                    <span> sell value at </span>
                                    <div
                                        style={{
                                            ...label_style,
                                            background: '#437396',
                                            color: 'white',
                                        }}
                                    >
                                        {numeral(sell_efficiency * 100).format('0')}%
                                    </div>
                                    <span> efficiency</span>
                                </div>
                            </small>
                        </div>

                        {item.notes.length > 0 && (
                            <div
                                style={{
                                    background: '#375451',
                                    padding: 5,
                                    borderRadius: 5,
                                    marginTop: 5,
                                }}
                            >
                                <small>
                                    {item.notes.map(note => {
                                        return (
                                            <div
                                                style={{ lineHeight: 1.3, display: 'inline-block' }}
                                                key={item._id}
                                            >
                                                {note}
                                            </div>
                                        )
                                    })}
                                </small>
                            </div>
                        )}

                        <hr style={{ marginBottom: 0 }} />
                        <div style={{ marginBottom: 0 }} className="row">
                            {Object.keys(item.stats).map(key => {
                                let stat = item.stats[key]
                                let value = stat.value
                                let title = `${value} ${
                                    convertStatName(key)[0]
                                } is worth approximately ${numeral(stat.gold_value).format(
                                    '0,0',
                                )} gold`
                                return (
                                    <div
                                        title={title}
                                        key={`${item.name}-${key}-${item.version}`}
                                        className="col s6"
                                    >
                                        {convertStatName(key)[0]}: {value}
                                        <div style={{ display: 'inline-block', marginLeft: 8 }}>
                                            <small style={{ color: 'gold' }}>
                                                {numeral(stat.gold_value).format('0,0')}g
                                            </small>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <hr style={{ marginTop: 0 }} />
                        <div
                            dangerouslySetInnerHTML={{ __html: stripHtml(item.description) }}
                        ></div>
                    </React.Fragment>
                )}
            </div>
        </LazyLoad>
    )
}
