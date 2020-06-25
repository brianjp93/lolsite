import React, { useMemo, useState, useCallback, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import fuzzysearch from 'fuzzysearch'
import LazyLoad from 'react-lazyload'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts'

export function ChampionsPage(props) {
    const theme = props.store.state.theme
    return (
        <Skeleton store={props.store} route={props.route}>
            <div className="container">
                <ChampionGrid {...props} theme={theme} />
            </div>
        </Skeleton>
    )
}

export function ChampionGrid(props) {
    const [champions, setChampions] = useState([])
    const [processed_champions, setProcessedChampions] = useState([])
    const [search, setSearch] = useState('')

    const theme = props.theme

    const getChampions = useCallback(() => {
        let params = { full: true }
        return api.data.getChampions(params)
    }, [])

    const [max_stat, min_stat] = useMemo(() => {
        let maxes = {}
        let mins = {}
        for (let champ of processed_champions) {
            for (let name in champ.stats) {
                let val = champ.stats[name]
                if (maxes[name] === undefined || val > maxes[name]) {
                    maxes[name] = val
                }
                if (mins[name] === undefined || val < mins[name]) {
                    mins[name] = val
                }
            }
        }
        return [maxes, mins]
    }, [processed_champions])

    useEffect(() => {
        getChampions().then(response => {
            setChampions(response.data.data)
        })
    }, [getChampions])

    useEffect(() => {
        if (champions.length > 0) {
            let new_champions = champions.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                    return -1
                }
                if (a.name.toLowerCase() > b.name.toLowerCase()) {
                    return 1
                }
                return 0
            })
            setProcessedChampions(new_champions)
        }
    }, [champions])

    useEffect(() => {
        window.scrollTo(window.scrollX, window.scrollY - 1)
        window.scrollTo(window.scrollX, window.scrollY + 1)
    }, [search])
    return (
        <>
            <div className="row">
                <div className="col s12">
                    <div className="input-field">
                        <input
                            id="champion-search-field"
                            className={theme}
                            type="text"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                        />
                        <label htmlFor="champion-search-field">Champion Filter</label>
                    </div>
                </div>
            </div>
            <div>
                {processed_champions
                    .filter(champion => fuzzysearch(search, champion.name.toLowerCase()))
                    .map(champion => {
                        return (
                            <ChampionCard
                                key={`${champion._id}-${champion.version}`}
                                theme={theme}
                                champion={champion}
                                max_stat={max_stat}
                                min_stat={min_stat}
                            />
                        )
                    })}
            </div>
        </>
    )
}

export function ChampionCard(props) {
    const champion = props.champion
    // const label_style = { borderRadius: 4, padding: '0px 4px', display: 'inline-block' }
    const card_height = 300
    const sidepad = 10
    const theme = props.theme

    const stat_list = [
        { key: 'attack_damage', shortname: 'AD', longname: 'Attack Damage' },
        { key: 'attack_damage_per_level', shortname: 'AD/lvl', longname: 'Attack Damage / Level' },
        { key: 'attack_speed', shortname: 'AS', longname: 'Attack Speed' },
        { key: 'attack_speed_per_level', shortname: 'AS/lvl', longname: 'Attack Speed / Level' },
        { key: 'attack_range', shortname: 'range', longname: 'Attack Range' },
        { key: 'hp', shortname: 'HP', longname: 'HP' },
        { key: 'hp_per_level', shortname: 'HP/lvl', longname: 'HP / Level' },
        { key: 'hp_regen', shortname: 'HP Regen', longname: 'HP Regen' },
        { key: 'hp_regen_per_level', shortname: 'HP Regen/lvl', longname: 'HP Regen / Level' },
        // { key: 'crit', shortname: 'crit', longname: 'Crit Chance' },
        { key: 'move_speed', shortname: 'MS', longname: 'Movement Speed' },
        { key: 'mp', shortname: 'Mana', longname: 'Mana' },
        { key: 'mp_per_level', shortname: 'Mana/lvl', longname: 'Mana / Level' },
        { key: 'mp_regen', shortname: 'mana regen', longname: 'Mana Regen' },
        { key: 'mp_regen_per_level', shortname: 'mana regen/lvl', longname: 'Mana Regen / Level' },
        { key: 'spell_block', shortname: 'MR', longname: 'Magic Resist' },
        { key: 'spell_block_per_level', shortname: 'MR/lvl', longname: 'Magic Resist / Level' },
        { key: 'armor', shortname: 'Armor', longname: 'Armor' },
        { key: 'armor_per_level', shortname: 'Armor/lvl', longname: 'Armor / Level' },
    ]

    const data = useMemo(() => {
        let out = []
        for (let item of stat_list) {
            out.push({
                name: item.shortname,
                value: champion.stats[item.key],
                max: props.max_stat[item.key],
                min: props.min_stat[item.key],
                normalized_value: champion.stats[item.key] / props.max_stat[item.key],
            })
        }
        return out
    }, [champion, stat_list, props.max_stat, props.min_stat])

    const spells = useMemo(() => {
        if (champion.spells !== undefined) {
            return (
                <div>
                    {champion.spells.map(spell => {
                        return <div key={`${spell._id}`}>{spell.name}</div>
                    })}
                </div>
            )
        }
        return null
    }, [champion])

    return (
        <LazyLoad offset={500} height={card_height}>
            <div
                style={{
                    // display: 'inline-block',
                    height: card_height,
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    paddingTop: 0,
                    paddingRight: sidepad,
                    paddingLeft: sidepad,
                    position: 'relative',
                    minWidth: 250,
                    marginLeft: 10,
                    marginRight: 10,
                }}
                className={`quiet-scroll card-panel ${theme}`}
            >
                {Object.keys(champion).length > 0 && (
                    <>
                        <h6
                            style={{
                                fontWeight: 'bold',
                                marginBottom: 20,
                            }}
                        >
                            <img
                                style={{
                                    marginRight: 7,
                                    height: 50,
                                    borderRadius: 8,
                                    position: 'absolute',
                                    left: 10,
                                    top: 8,
                                }}
                                src={champion.image_url}
                                alt=""
                            />
                            <div
                                style={{
                                    display: 'inline-block',
                                    marginLeft: 60,
                                }}
                            >
                                {champion.name}
                            </div>
                        </h6>

                        <div style={{ display: 'inline-block' }}>
                            <RadarChart outerRadius={60} width={330} height={220} data={data}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="name" />
                                <Tooltip
                                    formatter={(value, name, data) => {
                                        return [data.payload.value, data.payload.name]
                                    }}
                                />
                                <Radar
                                    isAnimationActive={false}
                                    dataKey="normalized_value"
                                    stroke="#48bd9c"
                                    fill="#48bd9c"
                                    fillOpacity={0.8}
                                />
                            </RadarChart>
                        </div>

                        <div style={{ display: 'inline-block' }}>{spells}</div>
                    </>
                )}
            </div>
        </LazyLoad>
    )
}
