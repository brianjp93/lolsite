import {useState, useMemo, useEffect, useCallback} from 'react'
import {useQuery, useMutation, useQueryClient} from 'react-query'
import Skeleton from '../general/Skeleton'
import ReactGA from 'react-ga'
import Orbit from '../general/spinners/orbit'
import MatchCard from './MatchCardHorizontal'
import Spectate from './Spectate'
import SummonerNotFound from './SummonerNotFound'
import ReactTooltip from 'react-tooltip'
import OverviewSelection from './OverviewSelection'
import numeral from 'numeral'
import api from '../../api/api'
import Modal from 'react-modal'
import MatchCardModal from './MatchCardModal'
import {MatchFilterForm} from './MatchFilterForm'
import type {MatchFilterFormType} from './MatchFilterForm'
import {VICTORY_COLOR, LOSS_COLOR} from '../../constants/general'
import {OftenPlaysWith} from './OftenPlaysWith'
import {RecentlyPlayedWith} from './RecentlyPlayedWith'

import type {BasicMatchType, SummonerType} from '../../types'

export let MODALSTYLE = {
  overlay: {
    zIndex: 2,
    backgroundColor: '#484848b0',
  },
  content: {
    zIndex: 2,
    backgroundColor: '#2c2d2f',
    border: 'none',
  },
}

export function Summoner({route, region, store}: {route: any; region: string; store: any}) {
  const [matchFilters, setMatchFilters] = useState<MatchFilterFormType>()
  const [lastRefresh, setLastRefresh] = useState<undefined | number>()
  const [isSpectateModalOpen, setIsSpectateModalOpen] = useState(false)
  const [isInitialQuery, setIsInitialQuery] = useState(true)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const count = 10

  const match_card_height = 400
  const custom_max_width = 'col l10 offset-l1 m12 s12'
  const match_id = route.match.params.match_id
  const isMatchModalOpen = match_id !== undefined

  useEffect(() => {
    ReactGA.event({
      category: 'Summoner Page',
      action: 'Summoner.jsx was mounted.',
    })
  }, [])

  const filterParams = useMemo(() => {
    let params = route.match.params
    let data = {
      summoner_name: params.summoner_name || null,
      id: params.id || null,
      region: region,
      count: count,
      queue: matchFilters?.queue,
      with_names: matchFilters?.summoners ? matchFilters.summoners.split(',') : '',
      champion_key: matchFilters?.champion,
      start_date: matchFilters?.startDate,
      end_date: matchFilters?.endDate,
      page: page,
    }
    return data
  }, [matchFilters, page, region, route.match.params])

  const pageQuery = useQuery(
    ['pageQuery', filterParams],
    () => api.player.getSummonerPage(filterParams).then((x) => x.data),
    {
      retry: false,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 1000 * 60 * 3,
      onSuccess: () => {
        setLastRefresh(new Date().getTime())
        setIsInitialQuery(false)
      },
    },
  )
  const summoner = pageQuery.data?.summoner
  const icon = pageQuery.data?.profile_icon
  const matches = pageQuery.data?.matches || []

  useEffect(() => {
    queryClient.prefetchQuery(
      ['pageQuery', {...filterParams, page: filterParams.page + 1}],
      () =>
        api.player
          .getSummonerPage({...filterParams, page: filterParams.page + 1})
          .then((x) => x.data),
      {
        retry: false,
        staleTime: 1000 * 60 * 3,
      },
    )
  }, [filterParams])

  const refreshPage = useCallback(() => {
    setPage(1)
  }, [setPage, setMatchFilters])

  // refresh page if the summoner changes
  useEffect(() => {
    refreshPage()
  }, [summoner?.simple_name, refreshPage])

  const spectateQuery = useQuery(
    ['spectate', region, summoner?._id],
    () => api.match.getSpectate({region, summoner_id: summoner._id}).then((x) => x.data),
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!summoner?._id,
      refetchInterval: 1000 * 60 * 5,
    },
  )

  const positionQuery = useQuery(
    ['positions', summoner?._id, region],
    () => api.player.getPositions({summoner_id: summoner._id, region}).then((x) => x.data.data),
    {retry: false, refetchOnWindowFocus: false, enabled: !!summoner?._id},
  )

  const queues = useMemo(() => {
    const queue_elt = document.getElementById('queues')
    const queues = JSON.parse(queue_elt?.innerHTML || '')
    let qdict: Record<number, any> = {}
    for (var q of queues) {
      q.description = q.description.replace('games', '').trim()
      qdict[q._id] = q
    }
    return qdict
  }, [])

  const closeModal = () => {
    const pathname = window.location.pathname.split(/match\/\w+/)[0]
    route.history.push(pathname)
  }

  const pagination = () => {
    const disabled = {
      disabled: pageQuery.isFetching,
    }
    return (
      <div>
        <button
          {...disabled}
          onClick={() => setPage((x) => Math.max(1, x - 1))}
          className="dark btn-small"
        >
          <i className="material-icons">chevron_left</i>
        </button>
        <button
          {...disabled}
          style={{marginLeft: 8}}
          onClick={() => setPage((x) => x + 1)}
          className={'dark btn-small'}
        >
          <i className="material-icons">chevron_right</i>
        </button>
        <div style={{display: 'inline-block', marginLeft: 8}}>{page}</div>
        {pageQuery.isFetching && (
          <div style={{display: 'inline-block', marginLeft: 10}}>
            <Orbit size={25} />
          </div>
        )}
      </div>
    )
  }

  return (
    <Skeleton store={store} topPad={0}>
      <div style={{minHeight: 1000}}>
        {pageQuery.isLoading && isInitialQuery && (
          <div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 100,
              }}
            >
              <Orbit size={300} style={{margin: 'auto'}} />
            </div>
          </div>
        )}

        {pageQuery.isSuccess && !summoner && <SummonerNotFound store={store} />}

        {!pageQuery.isLoading && summoner && (
          <div>
            {matches.length > 0 && (
              <Modal isOpen={isMatchModalOpen} onRequestClose={closeModal} style={MODALSTYLE}>
                <MatchCardModal
                  closeModal={closeModal}
                  matchCardHeight={match_card_height}
                  summoner={summoner}
                  region={region}
                  store={store}
                  route={route}
                />
              </Modal>
            )}
            <div className="row" style={{marginBottom: 0}}>
              <div className="col l10 offset-l1">
                <div
                  style={{
                    width: 400,
                    display: 'inline-block',
                    marginRight: 15,
                  }}
                >
                  {summoner?.name !== undefined && region && (
                    <SummonerCard
                      refreshPage={refreshPage}
                      region={region}
                      lastRefresh={lastRefresh}
                      positions={positionQuery.data || []}
                      icon={icon}
                      summoner={summoner}
                      store={store}
                      spectateData={spectateQuery.data}
                      isSpectateModalOpen={isSpectateModalOpen}
                      setIsSpectateModalOpen={setIsSpectateModalOpen}
                    />
                  )}
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'top',
                  }}
                >
                  <div
                    style={{
                      minWidth: 750,
                      padding: 15,
                    }}
                    className={`dark card-panel`}
                  >
                    <OverviewSelection store={store} summoner={summoner} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className={`${custom_max_width}`}>
                <div className="row">
                  <div className="col l6 m12">
                    <MatchFilterForm
                      onUpdate={(data) => {
                        setMatchFilters(data)
                        setPage(1)
                      }}
                    />
                  </div>
                  <div className="col l6 m12">
                    <div
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'top',
                      }}
                    >
                      <RecentlyPlayedWith
                        region={region}
                        summoner={summoner}
                        matches={matches || []}
                        store={store}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row" style={{visibility: 'visible'}}>
              <div className="col l10 offset-l1 m12 s12">
                <div style={{display: 'inline-block'}}>
                  {pagination()}
                  {pageQuery.isLoading && (
                    <div style={{width: 600}}>
                      <Orbit
                        size={200}
                        style={{
                          margin: 'auto',
                        }}
                      />
                    </div>
                  )}
                  {!pageQuery.isLoading &&
                    matches.map((match: BasicMatchType, key: number) => {
                      return (
                        <MatchCard
                          key={`${key}-${match._id}`}
                          index={key}
                          store={store}
                          match={match}
                          comment_count={0}
                          region={region}
                          queues={queues}
                          summoner={summoner}
                        />
                      )
                    })}
                  {pagination()}
                </div>

                {summoner && (
                  <div
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'top',
                      marginLeft: 8,
                    }}
                  >
                    <h5 style={{marginBottom: 3}}>Often Plays With</h5>
                    <OftenPlaysWith region={region} summoner_id={summoner.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Skeleton>
  )
}

function SummonerCard({
  store,
  refreshPage,
  lastRefresh,
  summoner,
  icon,
  isSpectateModalOpen,
  setIsSpectateModalOpen,
  spectateData,
  positions,
  region,
}: {
  store: any
  refreshPage: () => void
  lastRefresh?: number
  summoner: SummonerType
  icon: any
  isSpectateModalOpen: boolean
  setIsSpectateModalOpen: (x: boolean) => void
  spectateData: any
  positions: any
  region: string
}) {
  const [timeDesc, setTimeDesc] = useState('')
  const generalRankImage = (tier: string) => {
    const tier_convert = {
      iron: 'Iron',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
      diamond: 'Diamond',
      master: 'Master',
      grandmaster: 'Grandmaster',
      challenger: 'Challenger',
    }
    const new_tier = tier.toLowerCase() as keyof typeof tier_convert
    if (tier_convert[new_tier]) {
      tier = tier_convert[new_tier]
    }
    return `${store.state.static}ranked-emblems/emblems/Emblem_${tier}.png`
  }
  useQuery(
    ['refreshTimeQuery'],
    () => {
      let now = new Date().getTime()
      if (lastRefresh) {
        const diff = Math.round((now - lastRefresh) / 1000)
        const minutes = Math.floor(diff / 60)
        let desc = ''
        if (minutes > 0) {
          if (minutes === 1) {
            desc = `a minute ago`
          } else if (minutes > 99) {
            desc = 'a long time ago'
          } else {
            desc = `${minutes} minutes ago`
          }
        } else {
          desc = 'a moment ago'
        }
        setTimeDesc(desc)
      }
    },
    {retry: false, refetchInterval: 1000 * 10},
  )

  const queueName = (queue: string) => {
    const convert: Record<string, string> = {
      RANKED_SOLO_5x5: 'Solo/Duo',
      RANKED_FLEX_SR: '5v5 Flex',
      RANKED_FLEX_TT: '3v3 Flex',
      RANKED_TFT: 'TFT',
    }
    return convert[queue] || queue
  }

  const getWinRate = (wins: number, losses: number) => {
    return (wins / (wins + losses)) * 100
  }

  const isFavorite = store.state.favorites.filter((x: any) => x.summoner === summoner.id).length > 0

  const toggleFavorite = useMutation(
    async () => {
      return api.player
        .Favorite({summoner_id: summoner.id, verb: isFavorite ? 'remove' : 'set'})
        .then((x) => x.data.data)
    },
    {
      onSuccess: (data) => {
        store.setState({favorites: data})
      },
    },
  )

  const toggleDefault = useMutation(
    async () => {
      let data: {summoner_id: null | number} = {summoner_id: null}
      let keys = Object.keys(store.state.user.default_summoner)
      if (keys.length === 0) {
        data = {summoner_id: summoner.id}
      }
      return api.player.editDefaultSummoner(data).then((response) => {
        return response.data.default_summoner
      })
    },
    {
      onSuccess: (data) => {
        const user = {...store.state.user, default_summoner: data}
        store.setState({user: user})
      },
    },
  )

  const miniSeries = (progress: any) => {
    let letters: string[] = []
    for (var l of progress) {
      letters.push(l)
    }
    return letters.map((letter, key) => {
      const shared_styles = {
        margin: '0 2px',
        display: 'inline-block',
        height: 14,
        width: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'grey',
      }
      if (letter === 'W') {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: VICTORY_COLOR,
            }}
          ></div>
        )
      } else if (letter === 'L') {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: LOSS_COLOR,
            }}
          ></div>
        )
      } else {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: 'grey',
            }}
          ></div>
        )
      }
    })
  }
  return (
    <>
      <span>
        <div style={{position: 'relative', padding: 18}} className={`card-panel dark`}>
          {icon.image_url !== undefined && (
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              <img
                style={{
                  height: 50,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  borderRadius: 5,
                }}
                src={icon.image_url}
                alt={`profile icon ${icon._id}`}
              />
              <span
                style={{
                  display: 'inline-block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  fontSize: 'smaller',
                  width: 50,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 'inherit',
                    height: 'inherit',
                    textAlign: 'center',
                    marginTop: 43,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 'bold',
                      display: 'inline-block',
                      width: 40,
                      borderRadius: 4,
                      color: 'black',
                      background: 'white',
                      padding: '0 2px',
                    }}
                  >
                    {summoner.summoner_level}
                  </span>
                </span>
              </span>
            </span>
          )}

          <div
            style={{
              display: 'inline-block',
              width: 300,
              maxWidth: '87%',
              textAlign: 'center',
              verticalAlign: 'middle',
              height: 25,
            }}
          >
            <span
              style={{
                textDecoration: 'underline',
                fontWeight: 'bold',
              }}
            >
              {summoner.name}
            </span>
            <br />
            {region && (
              <Spectate.SpectateModal
                queue_convert={store.state.queue_convert}
                summoner_id={summoner._id}
                isSpectateModalOpen={isSpectateModalOpen}
                setIsSpectateModalOpen={setIsSpectateModalOpen}
                region={region}
              >
                <small>{spectateData ? 'Live Game!' : 'Check For Game'}</small>
              </Spectate.SpectateModal>
            )}
          </div>

          <span style={{position: 'absolute', right: 2, top: 2}}>
            <small
              className="unselectable"
              style={{
                display: 'inline-block',
                verticalAlign: 'top',
                marginRight: 3,
                borderStyle: 'solid',
                borderWidth: 1,
                padding: 2,
                borderRadius: 3,
                borderColor: '#ffffff40',
                color: '#ffffff70',
                marginTop: 3,
              }}
            >
              {lastRefresh !== null && <span>Last Refresh: </span>}
              <span style={{fontWeight: 'bold'}}>{timeDesc}</span>
            </small>
            <button onClick={() => refreshPage()} className="dark btn-small">
              <i className="material-icons">autorenew</i>
            </button>
          </span>

          {store.state.user.email !== undefined && (
            <>
              <ReactTooltip effect="solid" id="favorite-button">
                <span>{isFavorite ? 'Remove favorite' : 'Set favorite'}</span>
              </ReactTooltip>
              <span
                style={{
                  position: 'absolute',
                  right: 2,
                  top: 38,
                }}
              >
                <button
                  data-tip
                  data-for="favorite-button"
                  className="dark btn-small"
                  onClick={() => toggleFavorite.mutate()}
                >
                  <i className="material-icons">{isFavorite ? 'favorite' : 'favorite_border'}</i>
                </button>
              </span>
            </>
          )}

          <div style={{paddingTop: 10}}>
            {positions.map((pos: any) => {
              if (pos.queue_type === 'RANKED_SOLO_5x5') {
                var gen_positions = ['NONE', 'APEX']
                return (
                  <div key={`${pos.position}-${summoner._id}`}>
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          width: 50,
                        }}
                      >
                        {gen_positions.indexOf(pos.position) >= 0 && (
                          <img src={generalRankImage(pos.tier)} style={{height: 40}} alt="" />
                        )}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          lineHeight: 1,
                          verticalAlign: 'super',
                        }}
                      >
                        <span>
                          {pos.tier} {pos.rank}
                        </span>
                        <br />
                        <small>
                          <span
                            style={{
                              fontWeight: 'bold',
                            }}
                          >{`${numeral(getWinRate(pos.wins, pos.losses)).format(
                            '0.0',
                          )}%`}</span>{' '}
                          - {pos.wins}W / {pos.losses}L
                        </small>
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'absolute',
                          right: 18,
                        }}
                      >
                        <small className={`dark pill`}>{queueName(pos.queue_type)}</small>{' '}
                        <span className={`dark pill`}>{pos.league_points} LP</span>
                        {pos.series_progress && (
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            {miniSeries(pos.series_progress)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
            {positions.map((pos: any) => {
              if (pos.queue_type !== 'RANKED_SOLO_5x5') {
                return (
                  <div key={`${pos.position}-${pos.queue_type}-${summoner._id}`}>
                    <hr />
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          width: 50,
                        }}
                      >
                        <img src={generalRankImage(pos.tier)} style={{height: 40}} alt="" />
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          lineHeight: 1,
                          verticalAlign: 'super',
                        }}
                      >
                        <span>
                          {pos.tier} {pos.rank}
                        </span>
                        <br />
                        <small>
                          <span
                            style={{
                              fontWeight: 'bold',
                            }}
                          >{`${numeral(getWinRate(pos.wins, pos.losses)).format(
                            '0.0',
                          )}%`}</span>{' '}
                          - {pos.wins}W / {pos.losses}L
                        </small>
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'absolute',
                          right: 18,
                        }}
                      >
                        <small className={`dark pill`}>{queueName(pos.queue_type)}</small>{' '}
                        <span className={`dark pill`}>{pos.league_points} LP</span>
                        {pos.series_progress && (
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            {miniSeries(pos.series_progress)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>

          {store.state.user.email !== undefined && (
            <div>
              <button
                onClick={() => toggleDefault.mutate()}
                style={{width: '100%'}}
                className={`dark btn-small`}
              >
                {store.state.user.default_summoner.id === summoner.id && (
                  <>Remove as Default Profile</>
                )}
                {store.state.user.default_summoner.id !== summoner.id && (
                  <>Set as Default Profile</>
                )}
              </button>
            </div>
          )}
        </div>
      </span>
    </>
  )
}
