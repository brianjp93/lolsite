import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {useQuery} from 'react-query'

import {Timeline} from './Timeline'
import ChampionTimelines from './ChampionTimelines'
import StatOverview from './StatOverview'
import BuildOrder from './BuildOrder'
import RunePage from './RunePage'
import {MapEvents} from './MapEvents'
import {getMyPart} from '../../constants/general'
import {BanList} from './Bans'

import numeral from 'numeral'
import api from '../../api/api'
import {
  formatDatetimeFull,
  getTeam,
  ParticipantItems,
  convertTier,
  convertRank,
} from '../../constants/general'
import {rankParticipants} from './rankparticipants'
import {Comments} from '../comment/comments'
import queryString from 'query-string'

function MatchCardModal(props) {
  let store = props.store
  let match_id = props.route.match.params.match_id
  let puuid = props.summoner.puuid

  const [timeline_index, setTimelineIndex] = useState(null)
  // stats, comments
  const [view, setView] = useState('stats')

  const matchQuery = useQuery(
    ['full-match', match_id],
    () => api.match.getMatch({match_id}).then((response) => response.data.data),
    {retry: false, refetchOnWindowFocus: false},
  )
  const match = matchQuery.isSuccess ? matchQuery.data : {}

  const banQuery = useQuery(['match-bans', match_id], () => api.match.bans(match_id), {
    retry: false,
    refetchOnWindowFocus: false,
  })

  const participantQuery = useQuery(
    ['participants', match_id],
    () =>
      api.match
        .participants({match__id: match_id, apply_ranks: true})
        .then((response) => rankParticipants(response.data)),
    {retry: false, refetchOnWindowFocus: false},
  )
  const participants = participantQuery.isSuccess ? participantQuery.data : []

  const timelineQuery = useQuery(
    ['timeline', match_id],
    () =>
      api.match.timeline(match_id).then((data) => {
        data.sort((a, b) => a.timestamp - b.timestamp)
        return data
      }),
    {retry: false, refetchOnWindowFocus: false},
  )
  const timeline = timelineQuery.data || []

  const team_100 = getTeam(100, participants)
  const team_200 = getTeam(200, participants)

  function showParticipants() {
    let div_style = {
      width: 450,
      display: 'inline-block',
      borderWidth: 1,
      borderColor: 'grey',
      borderStyle: 'solid',
      borderRadius: 4,
      padding: '0px 8px',
    }
    return (
      <div>
        <div className="center-align">
          <div className="left-align" style={div_style}>
            {team_100.map((part) => {
              return <div key={`${part.id}`}>{participantLine(part)}</div>
            })}
            {banQuery.data && (
              <div>
                <div style={{display: 'inline-block', fontSize: 25}}>
                  Bans:
                </div>{' '}
                <BanList bans={banQuery.data.filter((x) => x.team === 100)} />
              </div>
            )}
          </div>

          <div style={{width: 8, display: 'inline-block'}}></div>

          <div className="left-align" style={div_style}>
            {team_200.map((part) => {
              return <div key={`${part.id}`}>{participantLine(part)}</div>
            })}
            {banQuery.data && (
              <div>
                <div style={{display: 'inline-block', fontSize: 25}}>
                  Bans:
                </div>{' '}
                <BanList bans={banQuery.data.filter((x) => x.team === 200)} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  function participantLine(part) {
    const stat_style = {
      borderRadius: 4,
      padding: '0px 4px',
      marginBottom: 3,
    }
    const gametime = match.game_duration / 1000 / 60
    let dpm = part.stats.total_damage_dealt_to_champions / gametime
    dpm = numeral(dpm).format('0,0')
    let vspm = part.stats.vision_score / gametime
    vspm = numeral(vspm).format('0.0')
    let cspm = (part.stats.neutral_minions_killed + part.stats.total_minions_killed) / gametime
    cspm = numeral(cspm).format('0.0')
    return (
      <div style={{height: 120}}>
        <div style={{marginBottom: 3}}>
          <Link target="_blank" to={`/${props.region}/${part.summoner_name}/`}>
            {part.summoner_name}
          </Link>
        </div>
        <div
          style={{
            display: 'inline-block',
            paddingRight: 5,
            verticalAlign: 'top',
          }}
        >
          <div>
            <img
              style={{height: 40, display: 'inline'}}
              src={part.champion.image?.file_40}
              alt=""
            />
            <div style={{display: 'inline-block', paddingLeft: 4}}>
              <img style={{height: 20, display: 'block'}} src={part.summoner_1_image} alt="" />
              <img style={{height: 20, display: 'block'}} src={part.summoner_2_image} alt="" />
            </div>
          </div>
          <img
            style={{height: 20, verticalAlign: 'top'}}
            src={part.stats.perk_0_image_url}
            alt=""
          />
          <img
            style={{height: 20, verticalAlign: 'top'}}
            src={part.stats.perk_sub_style_image_url}
            alt=""
          />
          <img
            style={{
              height: 20,
              verticalAlign: 'top',
              marginLeft: 4,
              borderRadius: 5,
            }}
            src={part.stats.item_6_image?.file_30}
            alt=""
          />
        </div>

        <ParticipantItems part={part} match={match} store={store} />

        <div
          style={{
            marginLeft: 8,
            display: 'inline-block',
            verticalAlign: 'top',
          }}
        >
          <h6 style={{marginTop: 0}}>
            <span style={{color: '#4f8fc7'}}>{part.stats.kills}</span>
            <span> / </span>
            <span style={{color: '#d43030'}}>{part.stats.deaths}</span>
            <span> / </span>
            <span style={{color: '#419241'}}>{part.stats.assists}</span>
          </h6>
          <div>{numeral(part.stats.gold_earned).format('0,0')} gold</div>
          <div>level {part.stats.champ_level}</div>
        </div>

        <div
          style={{
            display: 'inline-block',
            verticalAlign: 'top',
            marginLeft: 15,
          }}
        >
          <div style={{...stat_style, background: '#714545'}}>{dpm} DPM</div>
          <div style={{...stat_style, background: '#406286'}}>{vspm} VS/m</div>
          <div style={{...stat_style, background: '#7d763d'}}>{cspm} CS/m</div>
        </div>

        <div
          style={{
            marginLeft: 8,
            display: 'inline-block',
            verticalAlign: 'top',
            float: 'right',
          }}
        >
          {part.tier && (
            <div style={{...stat_style, background: '#6b41a0', fontSize: 'large'}}>
              {convertTier(part.tier)}
              {convertRank(part.rank)}
            </div>
          )}
          {part.impact_rank === 1 && (
            <div
              style={{
                display: 'inline-block',
                borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(66,66,93,1) 0%, rgba(133,74,128,1) 100%)',
                padding: '0px 10px',
              }}
            >
              MVP
            </div>
          )}
          <div>rank: {part.impact_rank}</div>
          <div title="Impact Score">I.S. {numeral(part.impact).format('0.00')}</div>
        </div>
      </div>
    )
  }

  const isDataAcquired = timeline.length && participants.length && match._id

  // on-load, check for query-string to tell what view to load
  useEffect(() => {
    const query = queryString.parse(window.location.search)
    if (query.show === 'comments') {
      setView('comments')
    }
  }, [])

  const getButtonStyle = (name) => {
    let button_style = {}
    if (view === name) {
      button_style.backgroundColor = '#0000'
    }
    return button_style
  }

  const mypart = getMyPart(participants, puuid)
  const header_style = {
    textAlign: 'center',
    textDecoration: 'underline',
  }
  const comp_style = {
    display: 'inline-block',
    verticalAlign: 'top',
  }
  return (
    <div style={{marginBottom: 300, minWidth: '100%'}}>
      <div
        style={{
          display: 'inline-block',
          position: 'fixed',
          top: 60,
          right: 60,
        }}
      >
        <button onClick={props.closeModal} className={`btn-floating btn-large red`}>
          <i className="material-icons">close</i>
        </button>
      </div>
      <div>
        <h4
          style={{
            display: 'inline-block',
            marginTop: 4,
            marginBottom: 8,
            marginRight: 8,
          }}
        >
          {store.state.queue_convert[match.queue_id] !== undefined && (
            <span>{store.state.queue_convert[match.queue_id].description}</span>
          )}
        </h4>
        <div style={{display: 'inline-block'}}>
          {formatDatetimeFull(match.game_creation)}
          <span> -- </span>
          {`${Math.floor(match.game_duration / 1000 / 60)}:${numeral(
            (match.game_duration / 1000) % 60,
          ).format('00')}`}
        </div>
        <div>
          patch {match.major}.{match.minor}
        </div>
      </div>

      <div style={{marginBottom: 10}}>
        <button
          style={getButtonStyle('stats')}
          onClick={() => {
            setView('stats')
            let qs = {show: 'stats'}
            qs = queryString.stringify(qs)
            window.history.pushState(null, null, '?' + qs)
          }}
          className={`${store.state.theme} btn`}
        >
          Game Stats
        </button>
        <button
          style={getButtonStyle('comments')}
          onClick={() => {
            setView('comments')
            let qs = {show: 'comments'}
            qs = queryString.stringify(qs)
            window.history.pushState(null, null, '?' + qs)
          }}
          className={`${store.state.theme} btn`}
        >
          Comments
        </button>
      </div>

      {view === 'stats' && (
        <div>
          <div>{showParticipants()}</div>
          <div style={{marginTop: 20, marginBottom: 100}}>
            {isDataAcquired && (
              <React.Fragment>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {[1, 2, 11].indexOf(match.map_id) >= 0 && (
                    <div style={comp_style}>
                      <h5 style={header_style}>Game Events</h5>
                      <MapEvents
                        summoner={props.summoner}
                        match={match}
                        participants={participants}
                        timeline={timeline}
                        setOuterTimelineIndex={setTimelineIndex}
                        store={props.store}
                        route={props.route}
                      />
                    </div>
                  )}
                  <div style={comp_style}>
                    <h5 style={header_style}>Game Timeline</h5>
                    <Timeline
                      summoner={props.summoner}
                      match={match}
                      participants={participants}
                      timeline_index={timeline_index}
                      timeline={timeline}
                      store={props.store}
                      route={props.route}
                    />
                  </div>
                  <div style={comp_style}>
                    <div style={{marginLeft: 30, marginRight: 8}}>
                      <h5 style={header_style}>Champion Timelines</h5>
                      <ChampionTimelines
                        theme={store.state.theme}
                        my_part={mypart}
                        summoner={props.summoner}
                        participants={participantQuery.data || []}
                        timeline={timeline}
                        expanded_width={500}
                      />
                    </div>
                  </div>
                  <div style={comp_style}>
                    <h5 style={header_style}>Champion Stats</h5>
                    <StatOverview
                      participants={participantQuery.data || []}
                      match={match}
                      store={props.store}
                      mypart={mypart}
                      is_expanded={true}
                    />
                  </div>
                  <div style={{...comp_style, alignSelf: 'baseline'}}>
                    <h5 style={header_style}>Build Order</h5>
                    <BuildOrder
                      theme={store.state.theme}
                      timeline={timeline}
                      expanded_width={500}
                      participants={participantQuery.data || []}
                      summoner={props.summoner}
                      my_part={mypart}
                      match_id={match._id}
                    />
                  </div>
                  <div style={{...comp_style, alignSelf: 'baseline'}}>
                    <h5 style={header_style}>Runes</h5>
                    <RunePage
                      matchCardHeight={props.matchCardHeight}
                      mypart={mypart}
                      participants={participantQuery.data || []}
                      match={match}
                      store={props.store}
                      pageStore={props.pageStore}
                    />
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {view === 'comments' && <Comments theme={store.state.theme} match={match} />}

      <div style={{height: 100}}></div>
    </div>
  )
}

export default MatchCardModal
