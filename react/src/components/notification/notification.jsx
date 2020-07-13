import React from 'react'
import Skeleton from '../general/Skeleton'


export function Notification(props) {
    return (
        <div>
        </div>
    )
}


export function NotificationPage(props) {
    return (
        <Skeleton store={props.store}>
            <div>
                HI THERE
            </div>
        </Skeleton>
    )
}
