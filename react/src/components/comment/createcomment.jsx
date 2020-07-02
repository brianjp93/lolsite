import React, { useState } from 'react'
import MdEditor from 'react-markdown-editor-lite'
import 'react-markdown-editor-lite/lib/index.css'
import { mdParser } from '../../constants/mdparser'


export function CreateComment(props) {
    const [text, setText] = useState('')
    const setView = props.setView
    return (
        <div>
            <MdEditor
                style={{minHeight: 300, minWidth: '100%'}}
                value={text}
                renderHTML={(text) => mdParser.render(text)}
                onChange={(text, html) => setText(text)}
                placeholder='a comment on the match...'
                type="text"
            />
        </div>
    )
}
