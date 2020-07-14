import React, { useState, useCallback, useEffect } from 'react'
import Skeleton from '../general/Skeleton'
import api from '../../api/api'

export function Notification(props) {
    return <div></div>
}

export function NotificationGroup(props) {
    const [comments, setComments] = useState([])
    const index = props.index
    const group = props.group

    useEffect(() => {
        if (comments.length < props.comments.length) {
            setComments(props.comments)
        }
    }, [props.comments, comments])
    return (
        <tr>
            <td>{index}</td>
            <td>
                There are {group.comment__count} new comments on match {group.get_match_id}
            </td>
        </tr>
    )
}

export function NotificationPage(props) {
    const [groups, setGroups] = useState([])
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(null)
    const [marked, setMarked] = useState(new Set())
    const order_by = '-created_date'
    const limit = 20
    const is_read = false

    const getDateForUnitGroups = useCallback(
        groups => {
            let new_groups = [...groups]
            const match_id_list = new_groups.map(x => x.comment__match__id)
            const params = {
                match_id_list,
                start: 0,
                end: groups.length,
                order_by,
                is_read,
            }
            return api.notification.getNotifications(params)
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
                for (let comment of response.data.data) {
                    for (let i = 0; i < new_groups.length; i++) {
                        if (new_groups[i].comment__match__id === comment.get_match_id) {
                            new_groups[i].comments = [comment]
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
                            <div style={{ display: 'inline-block', marginLeft: 8 }}>
                                ({count})
                            </div>
                        )}
                    </div>
                    <table className="table">
                        <thead>
                            <th>#</th>
                            <th>count</th>
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
                                        comments={group.comments}
                                    />
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Skeleton>
    )
}
