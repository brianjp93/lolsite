import React, { useState, useCallback, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import fuzzysearch from 'fuzzysearch'
import LazyLoad from 'react-lazyload'

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

    useEffect(() => {
        getChampions().then(response => {
            setChampions(response.data.data)
        })
    }, [getChampions])

    useEffect(() => {
        if (champions.length > 0) {
            setProcessedChampions(champions)
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
            <div className="row">
                {processed_champions
                    .filter(champion => fuzzysearch(search, champion.name.toLowerCase()))
                    .map(champion => {
                        return (
                            <div key={`${champion._id}-${champion.version}`} className="col m3">
                                <ChampionCard theme={theme} champion={champion} />
                            </div>
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
        { key: 'attack_speed', shortname: 'AS', longname: 'Attack Speed' },
        { key: 'attack_range', shortname: 'range', longname: 'Attack Range' },
        { key: 'hp', shortname: 'HP', longname: 'HP' },
        { key: 'hp_regen', shortname: 'HP Regen', longname: 'HP Regen' },
        { key: 'crit', shortname: 'crit', longname: 'Crit Chance' },
        { key: 'move_speed', shortname: 'MS', longname: 'Movement Speed' },
        { key: 'mp', shortname: 'Mana', longname: 'Mana' },
        { key: 'mp_regen', shortname: 'mana regen', longname: 'Mana Regen' },
        { key: 'spell_block', shortname: 'MR', longname: 'Magic Resist' },
        { key: 'armor', shortname: 'Armor', longname: 'Armor' },
    ]

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
                                    right: 0,
                                    top: 8,
                                }}
                                src={champion.image_url}
                                alt=""
                            />
                            <div
                                style={{
                                    width: '70%',
                                    display: 'inline-block',
                                }}
                            >
                                {champion.name}
                            </div>
                        </h6>

                        {stat_list.map((elt, key) => {
                            return (
                                <div key={key}>
                                    <span> {elt.shortname} </span>
                                    <span> : </span>
                                    <span>{champion.stats[elt.key]}</span>
                                    <span> + </span>
                                    <span>{champion.stats[`${elt.key}_per_level`]}</span>
                                    <span> per level</span>
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
        </LazyLoad>
    )
}
