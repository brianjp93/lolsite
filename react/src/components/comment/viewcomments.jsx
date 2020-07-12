import React, { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../api/api'
import ReactTooltip from 'react-tooltip'
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
    const [order_by, setOrderBy] = useState('-popularity')
    const limit = 10
    const match = props.match
    const summoners = props.summoners !== undefined ? props.summoners : []

    const order_by_options = [
        ['-popularity', 'Most Liked'],
        ['popularity', 'Most Disliked'],
        ['-created_date', 'Newest'],
        ['created_date', 'Oldest'],
    ]

    const getComments = useCallback(() => {
        const end = page * limit
        const start = end - limit
        const data = {
            match_id: match.id,
            start,
            end,
            nest: 2,
            depth: 5,
            order_by: order_by,
        }
        return api.player.getComments(data)
    }, [match, limit, page, order_by])

    // get and set comments when necessary
    useEffect(() => {
        if (match !== undefined && match.id !== undefined) {
            getComments().then(response => {
                setComments(response.data.data)
                setCommentCount(response.data.count)
            })
        }
    }, [getComments, match, order_by])

    return (
        <div style={{ marginBottom: 50, marginTop: 20 }}>
            <div>
                <div style={{ display: 'inline-block' }}>
                    <Pagination
                        limit={limit}
                        theme={props.theme}
                        page={page}
                        setPage={setPage}
                        count={comment_count}
                    />
                </div>
                <div
                    style={{
                        display: 'inline-block',
                        paddingLeft: 15,
                    }}
                    className={`input-field ${props.theme}`}
                >
                    <select
                        onChange={event => setOrderBy(event.target.value)}
                        value={order_by}
                        ref={elt => {
                            window.$(elt).formSelect()
                        }}
                    >
                        {order_by_options.map((elt, key) => {
                            return (
                                <option key={key} value={elt[0]}>
                                    {elt[1]}
                                </option>
                            )
                        })}
                    </select>
                </div>
            </div>
            <div style={{ height: 20 }}></div>
            {comments.map(comment => {
                return (
                    <Comment
                        summoners={summoners}
                        key={`${comment.id}`}
                        setView={props.setView}
                        setReplyComment={props.setReplyComment}
                        comment={comment}
                        theme={props.theme}
                        match={props.match}
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
    const summoners = props.summoners !== undefined ? props.summoners : []

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

    const player_in_game = useMemo(() => {
        if (props.match !== undefined && props.match.participants !== undefined) {
            if (comment.summoner !== undefined) {
                const participants = props.match.participants
                for (let part of participants) {
                    if (part.summoner_id === comment.summoner._id) {
                        return part
                    }
                }
            }
        }
        return {}
    }, [props.match, comment])

    const is_me = useMemo(() => {
        if (comment.summoner !== undefined) {
            for (let summ of summoners) {
                if (summ._id === comment.summoner._id) {
                    return true
                }
            }
        }
        return false
    }, [summoners, comment])

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

    let name_style = {
        color: '#8badad'
    }
    if (is_me) {
        name_style.color = '#a8efef'
        name_style.fontWeight = 'bold'
    }
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
                            {player_in_game.champion !== undefined && (
                                <>
                                    <ReactTooltip id={`summoner-in-game-tooltip`} effect="solid">
                                        <span>This player was {player_in_game.champion.name} in this game.</span>
                                    </ReactTooltip>
                                    <div
                                        style={{ display: 'inline-block' }}
                                        data-tip
                                        data-for="summoner-in-game-tooltip"
                                    >
                                        <div style={{ display: 'inline-block', marginRight: 4 }}>
                                            <img
                                                style={{width: 18, borderRadius: '50%'}}
                                                src={player_in_game.champion.image_url} alt="" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div
                                style={{
                                    marginTop: 8,
                                    marginBottom: 8,
                                    marginRight: 3,
                                    display: 'inline-block',
                                    ...name_style,
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
                                            summoners={props.summoners}
                                            theme={props.theme}
                                            setReplyComment={props.setReplyComment}
                                            setView={props.setView}
                                            comment={reply}
                                            match={props.match}
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
    let down_color = '#b34c4c'
    let up_color = '#409e3f'
    if (comment.is_liked) {
        up_style.color = up_color
        up_style.border = '2px solid ' + up_color
    }
    if (comment.is_disliked) {
        down_style.color = down_color
        down_style.border = '2px solid ' + down_color
    }
    const like_dislike_count = {
        fontWeight: 'bold',
        display: 'inline-block',
        fontSize: 'small',
        verticalAlign: 'text-bottom',
    }
    return (
        <div>
            <div style={{ ...like_dislike_count, marginRight: 5, color: down_color }}>
                {comment.dislikes}
            </div>
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
            <div style={{ ...like_dislike_count, marginLeft: 5, color: up_color }}>
                {comment.likes}
            </div>

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
