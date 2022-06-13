import Skeleton from '../general/Skeleton'


export function ItemChangesPage(props) {
    return (
        <Skeleton store={props.store} route={props.route}>
            <ItemChanges {...props}/>
        </Skeleton>
    )
}

export function ItemChanges(props) {
    return (
        <div>
        </div>
    )
}

