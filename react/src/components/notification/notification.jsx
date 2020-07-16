import React, { useState, useCallback, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'
import { formatDatetimeFull } from '../../constants/general'

export function Notification(props) {
    const notification = props.notification
    const comment = notification.comment
    return (
        <>
            <div style={{ textDecoration: 'underline' }}>
                comment from <b>{comment.summoner.simple_name}</b>
            </div>
            <div>{comment.markdown}</div>
        </>
    )
}

export function NotificationGroup(props) {
    const [notification, setNotification] = useState([])
    const [redirect_match, setRedirectMatch] = useState(null)
    const index = props.index
    const group = props.group
    const is_read = props.is_read

    const getRelatedNotifications = useCallback(() => {
        const params = {
            match_id_list: [group.comment__match__id],
            start: 0,
            end: 20,
            is_read: is_read,
            order_by: '-created_date',
        }
        api.notification.getNotifications(params).then(response => {
            setNotification(response.data.data)
        })
    }, [is_read, group])

    const goToMatch = useCallback(() => {
        const data = { match_id_internal: group.comment__match__id }
        api.match.getMatch(data).then(response => {
            const match_url = response.data.data.url
            if (match_url.length === 0) {
            } else {
                const mark_noti_data = {
                    match_id_list: [group.comment__match__id],
                    is_read: true,
                }
                api.notification.markNotifications(mark_noti_data).then(response => {
                    const comments_url = match_url + '/?show=comments'
                    setRedirectMatch(comments_url)
                })
            }
        })
    }, [group])

    useEffect(() => {
        if (props.notification !== undefined) {
            if (notification.length < props.notification.length) {
                setNotification(props.notification)
            }
        }
    }, [props.notification, notification])
    if (redirect_match === null) {
        return (
            <>
                <tr>
                    <td>{index}</td>
                    <td>
                        There are {group.comment__count} new comments on a match from{' '}
                        {formatDatetimeFull(group.comment__match__game_creation)}
                        <div style={{ display: 'inline-block' }}>
                            <ReactTooltip id="mark-as-read-tooltip" effect="solid">
                                <span>Go to match and mark notifications as read.</span>
                            </ReactTooltip>
                            <div
                                style={{ display: 'inline-block' }}
                                data-tip
                                data-for="mark-as-read-tooltip"
                                className={`input-field ${props.theme}`}
                            >
                                <button
                                    onClick={goToMatch}
                                    style={{ marginLeft: 8 }}
                                    className={`btn btn-flat btn-small ${props.theme}`}
                                >
                                    go to match comments
                                </button>
                            </div>
                        </div>
                        <div>
                            {notification.length === 0 && (
                                <button
                                    onClick={getRelatedNotifications}
                                    style={{ marginLeft: 8 }}
                                    className={`btn btn-flat btn-small ${props.theme}`}
                                >
                                    show notifications
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
                {notification.length > 0 &&
                    notification.map((noti, key) => {
                        return (
                            <tr key={noti.id}>
                                <td colSpan={2}>
                                    <div style={{ marginLeft: 40 }}>
                                        <Notification notification={noti} theme={props.theme} />
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
            </>
        )
    } else {
        return <Redirect to={redirect_match} />
    }
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
                    resolve({ data: { data: [] } })
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
                        <h4 style={{ display: 'inline-block' }}>Notification Groups</h4>
                        {count !== null && (
                            <div style={{ display: 'inline-block', marginLeft: 8 }}>({count})</div>
                        )}
                    </div>
                    {groups.length > 0 && (
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
                                            is_read={is_read}
                                        />
                                    )
                                })}
                                {groups.length < count && (
                                    <tr>
                                        <td>
                                            <button
                                                onClick={() => setPage(page + 1)}
                                                className={`btn ${props.theme}`}
                                            >
                                                load more...
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                    {groups.length === 0 &&
                        <div>
                            No notifications right now.
                        </div>
                    }
                </div>
            </div>
        </Skeleton>
    )
}
