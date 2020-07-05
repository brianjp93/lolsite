import React, { useState, useEffect, useCallback } from 'react'
import api from '../../api/api'
import { mdParser } from '../../constants/mdparser'
import { formatDatetime } from '../../constants/general'

export function Pagination(props) {
    const page = props.page
    const setPage = props.setPage
    const theme = props.theme
    const count = props.count
    const limit = props.limit

    const isButtonDisabled = side => {
        if (side === 'left') {
            if (page <= 1) {
                return true
            }
        } else {
            const end = page * limit
            if (end >= count) {
                return true
            }
        }
        return false
    }

    const btn_style = { display: 'inline-block' }
    return (
        <div>
            <button
                disabled={isButtonDisabled('left')}
                onClick={() => {
                    if (page > 1) {
                        setPage(page - 1)
                    }
                }}
                style={{ ...btn_style }}
                className={`${theme} btn-small`}
            >
                <i className="material-icons">keyboard_arrow_left</i>
            </button>
            <div style={{ display: 'inline-block', width: 8 }}></div>
            <button
                disabled={isButtonDisabled('right')}
                onClick={() => setPage(page + 1)}
                style={{ ...btn_style }}
                className={`${theme} btn-small`}
            >
                <i className="material-icons">keyboard_arrow_right</i>
            </button>
        </div>
    )
}

export function ViewComments(props) {
    const [comments, setComments] = useState([])
    const [comment_count, setCommentCount] = useState(0)
    const [page, setPage] = useState(1)
    const limit = 10
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
                setCommentCount(response.data.count)
            })
        }
    }, [getComments, match])

    return (
        <div style={{ marginBottom: 50, marginTop: 20 }}>
            <Pagination
                limit={limit}
                theme={props.theme}
                page={page}
                setPage={setPage}
                count={comment_count}
            />
            <div style={{ height: 20 }}></div>
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
            <div style={{ height: 20 }}></div>
            <Pagination
                limit={limit}
                theme={props.theme}
                page={page}
                setPage={setPage}
                count={comment_count}
            />
        </div>
    )
}

export function Comment(props) {
    const [comment, setComment] = useState({})
    const [replies, setReplies] = useState([])
    const [reply_page, setReplyPage] = useState(1)
    const reply_limit = 10
    const comment_id = props.comment_id
    const tab_size = 15
    const hide_action_bar = props.hide_action_bar === undefined ? false : props.hide_action_bar

    // get page and set page to page + 1
    const getReplyPage = useCallback((comment_id, reply_list, page) => {
        const end = reply_limit * page
        const start = end - reply_limit
        let data = {
            comment_id,
            start,
            end,
            order_by: '-likes',
        }
        api.player.getReplies(data).then(response => {
            let new_replies = [...reply_list, ...response.data.data]
            setReplies(new_replies)
        })
        setReplyPage(page + 1)
    }, [])

    useEffect(() => {
        if (props.comment !== undefined) {
            setComment(props.comment)
        } else if (comment_id !== undefined) {
            // get comment from api
        }
    }, [props.comment, comment_id])

    useEffect(() => {
        if (comment.replies !== undefined) {
            if (comment.replies.length > replies.length) {
                setReplies(comment.replies)
            }
        }
    }, [comment, replies.length])
    return (
        <>
            <div
                className="match-comment"
                style={{
                    marginLeft: tab_size,
                    paddingLeft: 8,
                    borderLeft: '3px solid grey',
                    borderBottom: '2px solid grey',
                }}
            >
                {comment.id !== undefined && (
                    <div style={{ marginBottom: 20 }}>
                        <div>
                            <div
                                style={{
                                    marginTop: 8,
                                    marginBottom: 8,
                                    marginRight: 3,
                                    display: 'inline-block',
                                    color: '#8badad',
                                }}
                            >
                                <span>{comment.summoner.name}</span>
                                <span> - </span>
                                <small>{formatDatetime(comment.created_date)}</small>
                            </div>
                            {!hide_action_bar && (
                                <div style={{ display: 'inline-block', marginLeft: 15 }}>
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
                            style={{ marginLeft: 15 }}
                            dangerouslySetInnerHTML={{ __html: mdParser.render(comment.markdown) }}
                        ></div>
                        <div>
                            {replies.map(reply => {
                                return (
                                    <div key={`comment-reply-${reply.id}`}>
                                        <Comment
                                            theme={props.theme}
                                            setReplyComment={props.setReplyComment}
                                            setView={props.setView}
                                            comment={reply}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
            <div>
                {replies !== undefined &&
                    replies.length < comment.replies_count &&
                    !hide_action_bar && (
                        <div style={{ borderLeft: '3px dashed grey', marginLeft: tab_size }}>
                            <button
                                onClick={() => getReplyPage(comment.id, replies, reply_page)}
                                style={{}}
                                className={`${props.theme} btn btn-small btn-flat`}
                            >
                                show more
                            </button>
                        </div>
                    )}
            </div>
        </>
    )
}

export function ActionBar(props) {
    const [show_error, setShowError] = useState(false)
    const comment = props.comment
    const setComment = props.setComment

    const handleLikeClick = useCallback(() => {
        api.player
            .likeComment({ comment_id: comment.id, like: !comment.is_liked })
            .then(response => {
                setComment(response.data.data)
            })
            .catch(error => {
                if (
                    error.response !== undefined &&
                    error.response.data.status === 'NOT_LOGGED_IN'
                ) {
                    setShowError(true)
                }
            })
    }, [comment, setComment])

    const handleDislikeClick = useCallback(() => {
        api.player
            .dislikeComment({ comment_id: comment.id, dislike: !comment.is_disliked })
            .then(response => {
                setComment(response.data.data)
            })
            .catch(error => {
                if (
                    error.response !== undefined &&
                    error.response.data.status === 'NOT_LOGGED_IN'
                ) {
                    setShowError(true)
                }
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
        up_style.border = '2px solid green'
    }
    if (comment.is_disliked) {
        down_style.color = 'red'
        down_style.border = '2px solid red'
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
            {show_error && (
                <div style={{ display: 'inline-block' }}>
                    <span className="card-panel red darken-3">
                        Must be logged in to like or dislike comments.
                    </span>
                </div>
            )}
        </div>
    )
}
