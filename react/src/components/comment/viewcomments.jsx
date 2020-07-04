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
    const [reply_page, setReplyPage] = useState(0)
    const reply_limit = 10
    const comment_id = props.comment_id
    const tab_size = 15
    const hide_action_bar = props.hide_action_bar === undefined ? false : props.hide_action_bar

    // get new replies when reply_page is incremented
    // increment happens when `show more` is clicked
    useEffect(() => {
        if (reply_page > 0) {
            const end = reply_limit * reply_page
            const start = end - reply_limit
            let data = {
                comment_id: comment.id,
                start,
                end,
                order_by: '-likes',
            }
            api.player.getReplies(data).then(response => {
                let new_replies = [...replies, ...response.data.data]
                setReplies(new_replies)
            })
        }
    }, [reply_page, comment.id])

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
                                    color: '#8badad',
                                }}
                            >
                                <span>{comment.summoner.name}</span> 
                                <span> - </span>
                                <small>{formatDatetime(comment.created_date)}</small>
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
                        <div>
                            <button
                                onClick={() => setReplyPage(reply_page + 1)}
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
        </div>
    )
}
