import React, { useState } from 'react'
import PropTypes from 'prop-types'
import PlayerChampionSummary from './PlayerChampionSummary'
import RankHistory from './RankHistory'


function OverviewSelection(props) {
    const [selection, setSelection] = useState('champion-overview')

    return (
        <div style={{display: 'inline-block'}}>
            <div>
                <button
                    onClick={() => setSelection('champion-overview')}
                    className={`${props.store.state.theme} btn-small`}>
                    Champion Overview
                </button>
                <button
                    onClick={() => setSelection('rank-history')}
                    className={`${props.store.state.theme} btn-small`}>
                    Rank History
                </button>
            </div>
            <div>
                {selection === 'champion-overview' &&
                    <PlayerChampionSummary
                        store={props.store}
                        parent={props.parent}
                        summoner={props.summoner} />
                }
                {selection === 'rank-history' &&
                    <RankHistory />
                }
            </div>
        </div>
    )
}
OverviewSelection.propTypes = {
    store: PropTypes.object,
    parent: PropTypes.object,
    summoner: PropTypes.object,
}

export default OverviewSelection