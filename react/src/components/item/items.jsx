import React, { useState, useEffect } from 'react'
import Skeleton from '../general/Skeleton'


export function ItemsPage(props) {
    return (
        <Skeleton>
            <ItemsGrid {...props} />
        </Skeleton>
    )
}

export function ItemsGrid(props) {
    return (
        <div>
        </div>
    )
}

function ItemsGridDisplay(props) {
    const [items, setItems] = useState([])
    const [sortedItems, setSortedItems] = useState([])
    const [map_id, setMapId] = useState()
    const [order_by, setOrderBy] = useState('-gold')

    function getItems() {

    }

    function sortItems() {

    }

    useEffect(() => [
        getItems()
    ], [map_id])

    useEffect(() => {
        sortItems()
    }, [items, order_by])

    return (
        <div>
        </div>
    )
}

export function Item(props) {
    return (
        <div>
        </div>
    )
}

