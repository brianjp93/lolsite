import React, { useState, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import fuzzysearch from 'fuzzysearch'
import numeral from 'numeral'
import { getStatCosts } from '../../constants/general'


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
        }
    })
    return items
}

function generalFilter(items) {
    items = items.filter(item => {
        let champions = ['Sylas', 'Kalista', 'Gangplank', 'FiddleSticks']
        if (champions.indexOf(item.required_champion) >= 0) {
            return false
        }
        return true
    })
    return items
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
    MagicPen: ['Magic Pen', 'Magic Penetration'],
    CooldownReduction: ['CDR', 'Cooldown Reduction'],
    HealAndShieldPower: ['H+S', 'Heal and Shield Power'],
    PercentBaseHPRegen: ['Base Regen', 'Base Health Regen Percentage']
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
    const [map_id, setMapId] = useState(11)
    const [order_by, setOrderBy] = useState('-gold')
    const [search, setSearch] = useState('')
    const [is_purchasable, setIsPurchasable] = useState(false)

    const theme = props.store.state.theme

    function getItems() {
        api.data.items()
            .then(response => {
                setItems(response.data.data)
            })
    }

    useEffect(() => {
        getItems()
    }, [])

    useEffect(() => {
        if (items !== undefined && items.length > 0) {
            let new_items = sortItems(items, order_by)
            // filter map 
            new_items = new_items.filter(item => item.maps[map_id])
            // filter purchasable
            new_items = new_items.filter(item => item.gold.purchasable)
            // general filter
            new_items = generalFilter(new_items)
            setSortedItems(new_items)
        }
    }, [items, order_by, map_id])

    return (
        <div>
            <div className="input-field">
                <input
                    id='item-search-field'
                    className={theme}
                    type="text"
                    value={search}
                    onChange={event => setSearch(event.target.value)} />
                <label htmlFor='item-search-field'>Item Filter</label>
            </div>
            <ItemsGridDisplay
                search={search}
                theme={theme}
                items={sortedItems} />
        </div>
    )
}

function ItemsGridDisplay(props) {
    const items = props.items
    const theme = props.theme
    const search = props.search
    return (
        <div>
            <div className="row">
                {items.filter(item => fuzzysearch(search, item.name.toLowerCase())).map(item => {
                    return (
                        <div
                            key={`${item._id}-${item.version}`}
                            className="col m3">
                            <Item
                                theme={theme}
                                item={item} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function stripHtml(html) {
    return html.replace(/<(?!br\s*\/?)[^>]+>/g, '')
}

function processItem(item, stat_costs) {
    item = {...item}
    let x

    let description = stripHtml(item.description)

    x = description.match(/\+([0-9]+)% Base Mana Regen/)
    if (x !== null) {
        item.stats.BaseManaRegen = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+) Lethality/)
    if (x !== null) {
        item.stats.Lethality = parseFloat(x[1])
    }

    x = description.match(/\+([0-9]+)% Magic Penetration/)
    if (x !== null) {
        item.stats.MagicPen = parseFloat(x[1])
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

    for (let stat_name in item.stats) {
        let value = item.stats[stat_name]
        item.stats = {...item.stats}
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
    if (item.stats !== undefined && Object.keys(item.stats).length > 0) {
        stat_cost = Object.keys(item.stats).reduce((total, x) => total + item.stats[x].gold_value, 0)
        stat_efficiency = item.gold.total === 0 ? 0: stat_cost / item.gold.total
    }

    useEffect(() => {
        if (props.item !== undefined && Object.keys(props.item).length > 0) {
            setItem(processItem(props.item, getStatCosts()))
        }
    }, [props.item])

    const label_style = {borderRadius: 4, padding: '0px 4px', display: 'inline-block'}
    return (
        <div
            style={{
                height: 300,
                overflowY: 'scroll',
                overflowX: 'hidden',
                paddingTop: 0,
                paddingRight: sidepad,
                paddingLeft: sidepad,
                position: 'relative',
            }}
            className={`quiet-scroll card-panel ${theme}`}>
            {Object.keys(item).length > 0 &&
                <React.Fragment>
                    <h6
                        style={{
                            marginBottom: 0,
                            fontWeight: 'bold',
                        }}>
                        <img
                            style={{
                                marginRight: 7,
                                height: 40,
                                borderRadius: 8,
                                position: 'absolute',
                                right: 0,
                                top: 8,
                            }}
                            src={item.image_url} alt="" />
                        <div
                            style={{
                                width: '70%',
                                display: 'inline-block'
                            }}>
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
                        }}>
                        <small>
                            <div style={{color: '#f5e15e'}}>
                                {item.gold.total}g
                            </div>
                            <div style={{...label_style, background: '#471d4e'}}>
                                {numeral(stat_cost).format('0,0')} 
                            </div>
                            <span> gold value at </span>
                            <div style={{...label_style, background: '#437396', color: 'white'}}>
                                {numeral(stat_efficiency * 100).format('0')}%
                            </div>
                            <span> efficiency</span>
                        </small>
                    </div>
                    <hr style={{marginBottom: 0}} />
                    <div
                        style={{marginBottom: 0}}
                        className="row">
                        {Object.keys(item.stats).map(key => {
                            let stat = item.stats[key]
                            let value = stat.value
                            return (
                                <div
                                    key={`${item.name}-${key}-${item.version}`}
                                    className='col s6'>
                                    {convertStatName(key)[0]}: {value}
                                    <div style={{display: 'inline-block', marginLeft: 8}}>
                                        <small style={{color: 'gold'}}>
                                            {numeral(stat.gold_value).format('0,0')}g
                                        </small>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                        <hr style={{marginTop: 0}} />
                        <div dangerouslySetInnerHTML={{__html: stripHtml(item.description)}}>
                    </div>
                </React.Fragment>
            }
        </div>
    )
}

