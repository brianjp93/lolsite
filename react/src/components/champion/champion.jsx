import React from 'react'


export function ChampionsPage(props) {
    return (
        <Skeleton store={props.store} route={props.route}>
            <div className='container'>
                <ChampionGrid {...props} />
            </div>
        </Skeleton>
    )
}

export function ChampionGrid(props) {
    const [champions, setChampions] = useState([])
    const [process_champions, setProcessedChampions] = useState([])

    const getChampions = () => {
        return api.data.champions()
    }

    return (
        <div>
        </div>
    )
}

export function ChampionCard(props) {
    return (
        <div>
        </div>
    )
}
