import React, { useState, useCallback } from 'react'
import MdEditor from 'react-markdown-editor-lite'
import 'react-markdown-editor-lite/lib/index.css'
import { mdParser } from '../../constants/mdparser'
import api from '../../api/api'
import { stripHtmlFull } from '../../constants/general'
import ReactTooltip from 'react-tooltip'

function hasContent(markdown) {
    let plain = mdParser.render(markdown)
    plain = stripHtmlFull(plain)
    return plain.trim().length > 0
}

function isValid(markdown, summoner) {
    let new_errors = []
    if (!hasContent(markdown)) {
        new_errors.push('Add some text before posting.')
    }
    if (summoner === null) {
        new_errors.push('Please select a summoner to post as.')
    }
    return new_errors
}

export function CreateComment(props) {
    const [text, setText] = useState('')
    const [summoner, setSummoner] = useState(null)
    const setView = props.setView
    const match = props.match
    const theme = props.theme

    const createComment = useCallback(
        (match_id, markdown) => {
            const new_errors = isValid(markdown, summoner)
            if (new_errors.length === 0) {
                const data = {
                    markdown,
                    match_id,
                }
                api.player.createComment(data).then(response => {
                    console.log(response)
                })
            }
        },
        [summoner],
    )

    const handleChange = useCallback(({ html, text }) => {
        setText(text)
    }, [])

    const button_disabled = { disabled: isValid(text, summoner).length > 0 }

    return (
        <div>
            <MdEditor
                style={{ minHeight: 400, minWidth: '100%', marginBottom: 8, marginTop: 10 }}
                value={text}
                renderHTML={text => mdParser.render(text)}
                onChange={handleChange}
                placeholder="a comment on the match..."
                type="text"
            />
            {props.summoners.length === 0 && (
                <div>
                    <div className="card-panel red darken-3">
                        Connect a league summoner to your account before posting.
                    </div>
                </div>
            )}
            <div>
                <div style={{ maxWidth: 500, display: 'inline-block' }}>
                    <ReactTooltip id="post-as-summoner-select" effect="solid">
                        <span>Which summoner would you like to post as?</span>
                    </ReactTooltip>
                    <div
                        data-tip
                        data-for="post-as-summoner-select"
                        className={`input-field ${theme}`}
                    >
                        <select
                            onChange={event => setSummoner(event.target.value)}
                            value={summoner}
                            ref={elt => {
                                window.$(elt).formSelect()
                            }}
                        >
                            {props.summoners.map((obj, key) => {
                                return (
                                    <option key={key} value={obj.id}>
                                        {obj.name}
                                    </option>
                                )
                            })}
                        </select>
                        <label>Post as Summoner</label>
                    </div>
                </div>
            </div>
            <button
                {...button_disabled}
                style={{ marginRight: 3 }}
                onClick={() => createComment(match.id, text)}
                className={`${theme} btn-small`}
            >
                Post Comment
            </button>
            <button onClick={() => setView('view')} className={`${theme} btn-small`}>
                Discard Comment
            </button>
        </div>
    )
}
