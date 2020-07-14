import React, { useState, useCallback, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'

export function Notification(props) {
    const notification = props.notification
    return (
        <>
            <div>{notification.id}</div>
        </>
    )
}

export function NotificationGroup(props) {
    const [notification, setNotification] = useState([])
    const index = props.index
    const group = props.group

    useEffect(() => {
        if (props.notification !== undefined) {
            if (notification.length < props.notification.length) {
                setNotification(props.notification)
            }
        }
    }, [props.notification, notification])
    return (
        <>
            <tr>
                <td>{index}</td>
                <td>
                    There are {group.comment__count} new comments on match {group.get_match_id}
                </td>
            </tr>
            <tr>
                <td colSpan={2}>
                    <Notification notification={notification} theme={props.theme} />
                </td>
            </tr>
        </>
    )
}

export function NotificationPage(props) {
    const [groups, setGroups] = useState([])
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(null)
    // const [marked, setMarked] = useState(new Set())
    const order_by = '-created_date'
    const limit = 20
    const is_read = false

    const getDateForUnitGroups = useCallback(
        groups => {
            let new_groups = [...groups]
            const match_id_list = new_groups
                .filter(x => x.comment__count === 1)
                .map(x => x.comment__match__id)
            const params = {
                match_id_list,
                start: 0,
                end: groups.length,
                order_by,
                is_read,
            }
            if (match_id_list.length > 0) {
                return api.notification.getNotifications(params)
            } else {
                return new Promise((resolve, reject) => {
                    resolve({data: {data: []}})
                })
            }
        },
        [is_read],
    )

    const appendGroups = useCallback(() => {
        const end = page * limit
        const start = end - limit
        let params = {
            start,
            end,
            order_by,
            is_read,
            is_grouped: true,
        }
        api.notification.getNotifications(params).then(response => {
            let new_groups = response.data.data
            getDateForUnitGroups(new_groups).then(response => {
                for (let notification of response.data.data) {
                    for (let i = 0; i < new_groups.length; i++) {
                        if (new_groups[i].comment__match__id === notification.get_match_id) {
                            new_groups[i].notifications = [notification]
                        }
                    }
                }
                setGroups(old_groups => [...old_groups, ...new_groups])
            })
            setCount(response.data.count)
        })
    }, [page, limit, getDateForUnitGroups, is_read])

    useEffect(() => {
        if (groups.length === 0) {
            appendGroups()
        }
    }, [appendGroups, groups.length])

    return (
        <Skeleton store={props.store}>
            <div className="row" style={{ marginBottom: 0 }}>
                <div className="col l10 offset-l1">
                    <div>
                        <h4 style={{ display: 'inline-block' }}>Notifications</h4>
                        {count !== null && (
                            <div style={{ display: 'inline-block', marginLeft: 8 }}>({count})</div>
                        )}
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group, key) => {
                                return (
                                    <NotificationGroup
                                        index={key + 1}
                                        theme={props.store.state.theme}
                                        group={group}
                                        key={group.comment__match__id}
                                        count={group.comment__count}
                                        notification={group.notification}
                                    />
                                )
                            })}
                            {groups.length < count &&
                                <tr>
                                    <td>
                                        <button
                                            onClick={() => setPage(page+1)}
                                            className={`btn ${props.theme}`}>
                                            load more...
                                        </button>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </Skeleton>
    )
}
