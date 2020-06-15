import React, { useState, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import fuzzysearch from 'fuzzysearch'


export function ItemsPage(props) {
    return (
        <Skeleton store={props.store} route={props.route}>
            <div className="container">
                <ItemsGrid {...props} />
            </div>
        </Skeleton>
    )
}

export function ItemsGrid(props) {
    const [items, setItems] = useState([])
    const [sortedItems, setSortedItems] = useState([])
    const [map_id, setMapId] = useState(11)
    const [order_by, setOrderBy] = useState('-gold')
    const [search, setSearch] = useState('')

    const theme = props.store.state.theme

    function getItems() {
        api.data.items()
            .then(response => {
                setItems(response.data.data)
            })
    }

    function sortItems(items) {
        setSortedItems(items)
    }

    useEffect(() => {
        getItems()
    }, [])

    useEffect(() => {
        sortItems(items)
    }, [items, order_by])

    return (
        <div>
            <input
                className={theme}
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)} />
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

export function Item(props) {
    const item = props.item
    const theme = props.theme
    return (
        <div className={`card-panel ${theme}`}>
            {item.name}
        </div>
    )
}

