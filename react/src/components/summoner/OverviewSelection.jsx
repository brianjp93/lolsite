import {useState, useCallback} from 'react'
import PropTypes from 'prop-types'
import {PlayerChampionSummary} from './PlayerChampionSummary'
import RankHistory from './RankHistory'

function OverviewSelection(props) {
  const [selection, setSelection] = useState('champion-overview')

  return (
    <div style={{display: 'inline-block'}}>
      <div style={{paddingBottom: 10}}>
        <label htmlFor={`champion-overview-selection`}>
          <input
            id={`champion-overview-selection`}
            onChange={useCallback(() => setSelection('champion-overview'), [])}
            type="radio"
            checked={selection === 'champion-overview'}
          />
          <span>Champion Overview</span>
        </label>
        <div style={{display: 'inline-block', width: 10}}></div>
        <label htmlFor={`rank-history-selection`}>
          <input
            id={`rank-history-selection`}
            onChange={useCallback(() => setSelection('rank-history'), [])}
            type="radio"
            checked={selection === 'rank-history'}
          />
          <span>Rank History</span>
        </label>
      </div>
      <div>
        {selection === 'champion-overview' && (
          <PlayerChampionSummary summoner={props.summoner} theme={props.store.state.theme} />
        )}
        {selection === 'rank-history' && (
          <RankHistory summoner={props.summoner} theme={props.store.state.theme} />
        )}
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
