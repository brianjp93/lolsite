import React, { useState, useEffect } from 'react'
import { CreateComment } from './createcomment'
import { ViewComments } from './viewcomments'
import api from '../../api/api'


export function Comments(props) {
    const [view, setView] = useState('view')
    const [summoners, setSummoners] = useState([])
    const match = props.match
    const theme = props.theme

    useEffect(() => {
        const data = {}
        api.player.mySummoners(data)
            .then(response => setSummoners(response.data.data))
    }, [])

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
                        summoners={summoners}
                        theme={theme}
                        match={match}
                        setView={setView}
                    />
                </>
            }
            {view === 'create' &&
                <CreateComment
                    summoners={summoners}
                    theme={theme}
                    match={match}
                    setView={setView}
                    reply_to={null}
                />
            }
        </div>
    )
}
