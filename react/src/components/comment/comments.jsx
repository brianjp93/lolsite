import React, { useState } from 'react'
import { CreateComment } from './createcomment'
import { ViewComments } from './viewcomments'


export function Comments(props) {
    const [view, setView] = useState('view')
    const match = props.match
    const theme = props.theme

    return (
        <div>
            {view === 'view' &&
                <>
                    <button
                        onClick={() => setView('create')}
                        className={`${theme} btn-small`}>
                        New Comment
                    </button>
                    <ViewComments
                        match={match}
                        setView={setView}
                    />
                </>
            }
            {view === 'create' &&
                <CreateComment
                    setView={setView}
                />
            }
        </div>
    )
}
