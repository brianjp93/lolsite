import {useState, useMemo, useEffect, useCallback} from 'react'
import {useQuery} from 'react-query'
import {useQueryWithPrefetch} from '../../hooks'
import Skeleton from '../general/Skeleton'
import Orbit from '../general/spinners/orbit'
import MatchCard from './MatchCardHorizontal'
import SummonerNotFound from './SummonerNotFound'
import OverviewSelection from './OverviewSelection'
import api from '../../api/api'
import Modal from 'react-modal'
import MatchCardModal from './MatchCardModal'
import {MatchFilterForm} from './MatchFilterForm'
import type {MatchFilterFormType} from './MatchFilterForm'
import {OftenPlaysWith} from './OftenPlaysWith'
import {RecentlyPlayedWith} from './RecentlyPlayedWith'
import {SummonerCard} from './SummonerCard'

import type {BasicMatchType} from '../../types'

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
  const count = 10

  const match_card_height = 400
  const custom_max_width = 'col l10 offset-l1 m12 s12'
  const match_id = route.match.params.match_id
  const isMatchModalOpen = match_id !== undefined

  const filterParams = useMemo(() => {
    let params = route.match.params
    const start = count * page - count
    const data = {
      summoner_name: params.summoner_name || null,
      id: params.id || null,
      region: region,
      queue: matchFilters?.queue || '',
      start,
      limit: count,
      sync_import: false,
    }
    return data
  }, [matchFilters, page, region, route.match.params])

  const summonerQuery = useQuery(
    ['summoner', 'name', filterParams.summoner_name, filterParams.region],
    () => api.player.getSummonerByName(filterParams.summoner_name, filterParams.region),
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  )
  const summonerQueryRefetch = summonerQuery.refetch

  const matchQueryWithSync = useQueryWithPrefetch(
    ['matches-with-sync', 'by-summoner', {...filterParams, sync_import: true}],
    () =>
      api.match
        .getMatchesBySummonerName({...filterParams, sync_import: true})
        .then((x) => x.results),
    [
      'matches-with-sync',
      'by-summoner',
      {...filterParams, start: filterParams.start + count, sync_import: true},
    ],
    () =>
      api.match
        .getMatchesBySummonerName({
          ...filterParams,
          start: filterParams.start + count,
          sync_import: true,
        })
        .then((x) => x.results),
    {
      retry: true,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 1000 * 60 * 3,
      onSuccess: () => {
        setLastRefresh(new Date().getTime())
        setIsInitialQuery(false)
      },
      onError: () => {
        setPage(x => x - 1)
      }
    },
  )
  const matchQueryWithSyncRefetch = matchQueryWithSync.refetch

  const isMatchLoading = matchQueryWithSync.isFetching

  const summoner = summonerQuery.data
  const icon = summoner?.profile_icon
  const matches: BasicMatchType[] = matchQueryWithSync.data || []
  const positionQuery = useQuery(
    ['positions', summoner?._id, region],
    () =>
      summoner?._id
        ? api.player.getPositions({summoner_id: summoner._id, region}).then((x) => x.data.data)
        : undefined,
    {retry: false, refetchOnWindowFocus: false, enabled: !!summoner?._id},
  )
  const positionQueryRefetch = positionQuery.refetch

  const refreshPage = useCallback(() => {
    setPage(1)
    matchQueryWithSyncRefetch()
    summonerQueryRefetch()
    positionQueryRefetch()
  }, [
    setPage,
    matchQueryWithSyncRefetch,
    summonerQueryRefetch,
    positionQueryRefetch,
  ])

  // refresh page if the summoner changes
  useEffect(() => {
    refreshPage()
  }, [summoner?.simple_name, refreshPage])

  const spectateQuery = useQuery(
    ['spectate', region, summoner?._id],
    () => api.match.getSpectate({region, summoner_id: summoner!._id}).then((x) => x.data),
    {
      retry: false,
      enabled: !!summoner?._id,
    },
  )
  const spectateData = spectateQuery.isSuccess ? spectateQuery.data : undefined

  const match_ids = matches.map((x: any) => x.id)
  const commentQuery = useQuery(
    ['comment_count', match_ids],
    () => api.player.getCommentCount({match_ids: match_ids}).then((response) => response.data.data),
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: matches.length > 0,
      staleTime: 1000 * 60 * 3,
    },
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

  const matchFilterOnUpdate = useCallback((data: any) => {
    setMatchFilters(data)
    setPage(1)
  }, [])

  const pagination = () => {
    const disabled = {
      disabled: isMatchLoading,
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
        {isMatchLoading && (
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
        {isMatchLoading && isInitialQuery && (
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

        {matchQueryWithSync.isSuccess && !summonerQuery.isSuccess && <SummonerNotFound store={store} />}

        {(matchQueryWithSync.isSuccess || matchQueryWithSync.isSuccess) && summonerQuery.isSuccess && (
          <div>
            {matches.length > 0 && summoner && (
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
                      spectateData={spectateData}
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
                  <div style={{maxWidth: 415}} className="col l4 m12 collapsible-col">
                    <div
                      style={{
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
                    {summonerQuery.isSuccess && summoner && (
                      <div
                        style={{
                          verticalAlign: 'top',
                          marginLeft: 8,
                        }}
                      >
                        <h5 style={{marginBottom: 3}}>Often Plays With</h5>
                        <OftenPlaysWith region={region} summoner_id={summoner.id} />
                      </div>
                    )}
                  </div>
                  <div className="col l8 m12">
                    <MatchFilterForm onUpdate={matchFilterOnUpdate} />
                    {pagination()}
                    {matchQueryWithSync.isLoading && (
                      <div style={{width: 600}}>
                        <Orbit
                          size={200}
                          style={{
                            margin: 'auto',
                          }}
                        />
                      </div>
                    )}
                    {!matchQueryWithSync.isLoading &&
                      summonerQuery.isSuccess &&
                      matches.map((match: BasicMatchType, key: number) => {
                        return (
                          <MatchCard
                            key={`${key}-${match._id}`}
                            index={key}
                            store={store}
                            match={match}
                            comment_count={commentQuery.data && (commentQuery.data[match.id] || 0)}
                            region={region}
                            queues={queues}
                            summoner={summoner}
                          />
                        )
                      })}
                    {pagination()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Skeleton>
  )
}
