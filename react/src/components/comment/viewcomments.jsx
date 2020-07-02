import React, { useState, useEffect, useCallback } from 'react'
import api from '../../api/api'

export function ViewComments(props) {
    const [comments, setComments] = useState([])
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const setView = props.setView
    const match = props.match

    const getComments = useCallback(() => {
        const end = page * limit
        const start = end - limit
        const data = {
            match_id: match.id,
            start,
            end,
            nest: 2,
            depth: 5,
            order_by: '-likes',
        }
        return api.player.getComments(data)
    }, [match, limit, page])

    // get and set comments when necessary
    useEffect(() => {
        if (match !== undefined && match.id !== undefined) {
            getComments().then((response) => {
                setComments(response.data.data)
            })
        }
    }, [getComments, match])

    return (
        <div>
            {comments.map((comment) => {
                return (
                    <Comment key={`${comment.id}`} comment={comment} />
                )
            })}
        </div>
    )
}

function Comment(props) {
    const [comment, setComment] = useState({})
    const comment_id = props.comment_id

    useEffect(() => {
        if (props.comment !== undefined) {
            setComment(props.comment)
        }
        else if (comment_id !== undefined) {
            // get comment from api
        }
    }, [props.comment, comment_id])
    return (
        <div>
            {comment.markdown}
        </div>
    )
}
