import React, { useState, useEffect, useCallback } from 'react'
import api from '../../api/api'
import { mdParser } from '../../constants/mdparser'
import { formatDatetime } from '../../constants/general'

export function ViewComments(props) {
    const [comments, setComments] = useState([])
    const [page, setPage] = useState(1)
    const limit = 10
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
            getComments().then(response => {
                setComments(response.data.data)
            })
        }
    }, [getComments, match])

    return (
        <div>
            {comments.map(comment => {
                return (
                    <Comment
                        key={`${comment.id}`}
                        setView={props.setView}
                        setReplyComment={props.setReplyComment}
                        comment={comment}
                        theme={props.theme}
                    />
                )
            })}
        </div>
    )
}

export function Comment(props) {
    const [comment, setComment] = useState({})
    const comment_id = props.comment_id
    const tab_size = 15
    const tab_index = props.tab_index === undefined ? 0 : props.tab_index
    const full_margin = tab_size * tab_index
    const hide_action_bar = props.hide_action_bar === undefined ? false : props.hide_action_bar

    useEffect(() => {
        if (props.comment !== undefined) {
            setComment(props.comment)
        } else if (comment_id !== undefined) {
            // get comment from api
        }
    }, [props.comment, comment_id])
    return (
        <div
            style={{
                marginLeft: full_margin,
                paddingLeft: 8,
                borderLeft: '3px solid grey',
            }}
        >
            {comment.id !== undefined && (
                <div>
                    <div>
                        <div
                            style={{
                                marginBottom: 8,
                                marginRight: 3,
                                display: 'inline-block',
                            }}
                        >
                            {comment.summoner.name} - {formatDatetime(comment.created_date)}
                        </div>
                        {!hide_action_bar && (
                            <div style={{ display: 'inline-block' }}>
                                <ActionBar
                                    setView={props.setView}
                                    comment={comment}
                                    setComment={setComment}
                                    setReplyComment={props.setReplyComment}
                                    theme={props.theme}
                                />
                            </div>
                        )}
                    </div>
                    <div
                        dangerouslySetInnerHTML={{ __html: mdParser.render(comment.markdown) }}
                    ></div>
                    <div>
                        {comment.replies.map(reply => {
                            return (
                                <div key={`comment-reply-${reply.id}`}>
                                    <Comment
                                        theme={props.theme}
                                        setReplyComment={props.setReplyComment}
                                        setView={props.setView}
                                        comment={reply}
                                        tab_index={tab_index + 1}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export function ActionBar(props) {
    const comment = props.comment
    const setComment = props.setComment

    const handleLikeClick = useCallback(() => {
        api.player
            .likeComment({ comment_id: comment.id, like: !comment.is_liked })
            .then(response => {
                setComment(response.data.data)
            })
    }, [comment, setComment])

    const handleDislikeClick = useCallback(() => {
        api.player
            .dislikeComment({ comment_id: comment.id, dislike: !comment.is_disliked })
            .then(response => {
                setComment(response.data.data)
            })
    }, [comment, setComment])

    const gen_style = {
        padding: 3,
        cursor: 'pointer',
        border: '2px solid grey',
    }
    let up_style = { ...gen_style }
    let down_style = { ...gen_style }
    if (comment.is_liked) {
        up_style.color = 'green'
    }
    if (comment.is_disliked) {
        down_style.color = 'red'
    }
    return (
        <div>
            <i
                onClick={handleDislikeClick}
                style={{ ...down_style }}
                className="tiny material-icons"
            >
                keyboard_arrow_down
            </i>
            <div style={{ width: 4, display: 'inline-block' }}></div>
            <i onClick={handleLikeClick} style={{ ...up_style }} className="tiny material-icons">
                keyboard_arrow_up
            </i>
            <div style={{ display: 'inline-block' }}>
                <button
                    onClick={() => {
                        props.setReplyComment(comment)
                        props.setView('create')
                    }}
                    className={`${props.theme} btn btn-flat btn-small`}
                >
                    reply
                </button>
            </div>
        </div>
    )
}
