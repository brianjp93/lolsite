import React, {useState, useMemo} from 'react'
import {useQuery} from 'react-query'
import moment from 'moment'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'
import Orbit from '../general/spinners/orbit'
import StatBar from '../general/StatBar'
import {SummonerType, ChampionType} from '../../types'
import {useChampions} from '../../hooks'

import api from '../../api/api'

function truncateName(name: string) {
  let out = name
  if (name === null) {
    return ''
  }
  if (name.length > 8) {
    out = `${name.slice(0, 8)}...`
  }
  return out
}

const unselected_style: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 'small',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'grey',
  padding: 3,
  borderRadius: 3,
  cursor: 'pointer',
  width: 90,
  textAlign: 'center',
  margin: '0 4px',
}
const selected_style: React.CSSProperties = {
  ...unselected_style,
  fontWeight: 'bold',
  borderWidth: 2,
  borderColor: '#9aa8ce',
  color: '#9aa8ce',
}

const queue_selected_style: React.CSSProperties = {
  ...selected_style,
  borderColor: '#9accd2',
  color: '#9accd2',
}

const queues: Record<string, number[]> = {
  norms: [2, 430, 400],
  solo: [420],
  flex: [440],
  '3v3': [470],
  aram: [100, 450],
  clash: [700],
}

const fields = [
  'kda',
  'kills_sum',
  'deaths_sum',
  'assists_sum',
  'dpm',
  'gpm',
  'cspm',
  'vspm',
  'dtpd',
  'minutes',
  'wins',
  'losses',
]

export function PlayerChampionSummary({summoner, theme}: {summoner: SummonerType; theme: string}) {
  const [queueSelection, setQueueSelection] = useState('')
  const [timeDivision, setTimeDivision] = useState<'days' | 'season'>('days')
  const [timeValue, setTimeValue] = useState(30)
  const [isLoadAll, setIsLoadAll] = useState(false)
  const start = 0
  const end = 5

  const champions = useChampions()
  const versionQuery = useQuery(
    'version-query',
    () => api.data.getCurrentSeason().then((x) => x.data.data),
    {retry: false, refetchOnWindowFocus: false},
  )
  const major = versionQuery.data?.major

  const params = useMemo(() => {
    let data: any = {
      puuid: summoner.puuid,
      start: start,
      end: isLoadAll ? 500 : end,
      order_by: '-count',
      fields: fields,
    }
    if (timeDivision === 'days') {
      const now = moment()
      const start = now.subtract(timeValue, 'days')
      data.start_datetime = start.toISOString()
    } else if (timeDivision === 'season') {
      data.season = timeValue
    }

    if (queues[queueSelection]) {
      data.queue_in = queues[queueSelection]
    }
    return data
  }, [summoner, start, end, isLoadAll, timeDivision, timeValue, queueSelection])

  const statQuery = useQuery(
    ['stats', params],
    () => api.player.getChampionsOverview(params).then((x) => x.data.data),
    {retry: false, refetchOnWindowFocus: false, enabled: !!params.puuid},
  )
  const stats = statQuery.data || []

  return (
    <>
      <div>
        <div style={{marginBottom: 5}} className="row">
          <div style={{fontSize: 'small'}} className="col s12 unselectable">
            <div style={{display: 'inline-block'}}>
              <div
                onClick={() => {
                  setTimeDivision('days')
                  setTimeValue(30)
                }}
                style={
                  timeValue === 30 && timeDivision === 'days' ? selected_style : unselected_style
                }
              >
                30 days
              </div>
              <div
                onClick={() => {
                  setTimeValue(60)
                  setTimeDivision('days')
                }}
                style={
                  timeValue === 60 && timeDivision === 'days' ? selected_style : unselected_style
                }
              >
                60 days
              </div>
            </div>
            <div style={{display: 'inline-block', float: 'right'}}>
              {major !== undefined &&
                [major, major - 1, major - 2].map((ver: number, key: number) => {
                  return (
                    <div
                      key={`${ver}-${key}`}
                      onClick={() => {
                        setTimeDivision('season')
                        setTimeValue(ver)
                      }}
                      style={
                        timeValue === ver && timeDivision === 'season'
                          ? {...selected_style}
                          : {...unselected_style}
                      }
                    >
                      Season {ver}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
        <div style={{marginBottom: 5}} className="row">
          <div style={{fontSize: 'small'}} className="col s12 unselectable">
            <div style={{display: 'inline-block'}}>
              <div
                onClick={() => setQueueSelection('')}
                style={queueSelection === '' ? queue_selected_style : unselected_style}
              >
                All
              </div>
            </div>

            <div style={{display: 'inline-block', float: 'right'}}>
              <div
                onClick={() => setQueueSelection('solo')}
                style={'solo' === queueSelection ? queue_selected_style : unselected_style}
              >
                Solo/Duo
              </div>
              <div
                onClick={() => setQueueSelection('flex')}
                style={'flex' === queueSelection ? queue_selected_style : unselected_style}
              >
                Flex
              </div>
              <div
                onClick={() => setQueueSelection('norms')}
                style={'norms' === queueSelection ? queue_selected_style : unselected_style}
              >
                Norms
              </div>
              <div
                onClick={() => setQueueSelection('clash')}
                style={queueSelection === 'clash' ? queue_selected_style : unselected_style}
              >
                Clash
              </div>
              <div
                onClick={() => setQueueSelection('aram')}
                style={queueSelection === 'aram' ? queue_selected_style : unselected_style}
              >
                ARAM
              </div>
            </div>
          </div>
        </div>
        <div style={{marginBottom: 0}} className="row">
          <div className="col s12 quiet-scroll" style={{maxHeight: 300, overflowY: 'scroll'}}>
            {statQuery.isFetching && (
              <div style={{textAlign: 'center'}}>
                <Orbit size={80} style={{margin: 'auto'}} />
              </div>
            )}
            {stats.map((data: any, key: number) => {
              return (
                <React.Fragment key={`${data.champion_id}-${key}`}>
                  <div
                    style={{
                      display: 'inline-block',
                      width: 140,
                      borderStyle: 'solid',
                      borderWidth: 1,
                      borderColor: 'grey',
                      borderRadius: 4,
                      padding: 8,
                      margin: '0 2px',
                    }}
                    key={`${data.champion_id}-${key}`}
                  >
                    {!statQuery.isLoading && <ChampionData champions={champions} stats={data} />}
                  </div>
                  {(key + 1) % 5 === 0 && <br />}
                </React.Fragment>
              )
            })}
            {stats.length === 0 && statQuery.isSuccess && (
              <div
                style={{
                  display: 'inline-block',
                  width: '100%',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  borderColor: 'grey',
                  borderRadius: 4,
                  padding: 8,
                  margin: '0 2px',
                }}
              >
                <span>No Data</span>
              </div>
            )}
            {!(stats.length === 0 && !statQuery.isLoading) && !isLoadAll && (
              <div style={{paddingTop: 8}}>
                <button
                  onClick={() => setIsLoadAll(true)}
                  className={`${theme} btn-small`}
                  style={{width: '100%'}}
                >
                  Load All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ChampionData({champions, stats}: {champions: Record<number, ChampionType>; stats: any}) {
  const {
    count,
    kills_sum,
    deaths_sum,
    assists_sum,
    wins,
    losses,
    champion_id,
    champion,
    vspm,
    cspm,
    kda,
    dpm,
    dtpd,
  } = stats

  const average_kills = kills_sum / count
  const average_deaths = deaths_sum / count
  const average_assists = assists_sum / count
  // let win_percentage = (wins / (wins + losses)) * 100
  const champ = champions[champion_id]
  return (
    <div
      style={{
        display: 'inline-block',
        width: '100%',
      }}
    >
      {champ !== undefined && (
        <ReactTooltip id={`${champion_id}-image-tooltip`} effect="solid">
          <span>
            {champ.name}: {champ.title}
          </span>
        </ReactTooltip>
      )}
      {champ === undefined && (
        <ReactTooltip id={`${champion_id}-image-tooltip`} effect="solid">
          <span>{champion}</span>
        </ReactTooltip>
      )}
      <div data-tip data-for={`${champion_id}-image-tooltip`}>
        {champ !== undefined && (
          <img
            style={{maxHeight: 30, display: 'inline-block', borderRadius: '50%'}}
            src={champ.image?.file_30}
            alt=""
          />
        )}
        <div
          style={{
            marginLeft: 3,
            display: 'inline-block',
            fontSize: 'small',
          }}
        >
          <div style={{fontWeight: 'bold'}}>{truncateName(champion)}</div>
          <div>
            <span style={{fontWeight: 'bold'}}>{count}</span> games
          </div>
        </div>
      </div>

      <div>
        <StatBar
          theme="dark"
          val1={wins}
          val2={losses}
          label1={<span>{wins} Wins</span>}
          label2={<span>{losses} Losses</span>}
        />
      </div>

      <div
        style={{
          marginTop: -5,
          marginBottom: 5,
          borderBottomStyle: 'solid',
          borderBottomWidth: 1,
          borderBottomColor: 'grey',
          paddingBottom: 5,
        }}
      ></div>

      <div>
        <div>
          <span style={{fontWeight: 'bold'}}>{numeral(kda).format('0.00')}</span> <span>KDA</span>
        </div>
        <div style={{fontSize: 'small', paddingLeft: 15}}>
          <span style={{fontWeight: 'bold'}}>{numeral(average_kills).format('0.0')}</span>/
          <span style={{fontWeight: 'bold'}}>{numeral(average_deaths).format('0.0')}</span>/
          <span style={{fontWeight: 'bold'}}>{numeral(average_assists).format('0.0')}</span>
        </div>
      </div>

      <div style={{fontSize: 'small', marginTop: 5}}>
        <ReactTooltip id={`${champion_id}-dpm-tooltip`} effect="solid">
          <span>Damage per Minute</span>
        </ReactTooltip>
        <div data-tip data-for={`${champion_id}-dpm-tooltip`}>
          <span>DPM</span> : <span style={{fontWeight: 'bold'}}>{numeral(dpm).format('0,0')}</span>
        </div>
      </div>

      <div style={{fontSize: 'small'}}>
        <ReactTooltip id={`${champion_id}-dtpd-tooltip`} effect="solid">
          <span>Damage Taken per Death</span>
        </ReactTooltip>
        <div data-tip data-for={`${champion_id}-dtpd-tooltip`}>
          <span>DT/D</span> :{' '}
          <span style={{fontWeight: 'bold'}}>{numeral(dtpd).format('0,0')}</span>
        </div>
      </div>

      <div style={{fontSize: 'small'}}>
        <ReactTooltip id={`${champion_id}-cs-tooltip`} effect="solid">
          <span>CS per Minute</span>
        </ReactTooltip>
        <div data-tip data-for={`${champion_id}-cs-tooltip`}>
          <span>CS/M</span> :{' '}
          <span style={{fontWeight: 'bold'}}>{numeral(cspm).format('0.00')}</span>
        </div>
      </div>

      <div style={{fontSize: 'small'}}>
        <ReactTooltip id={`${champion_id}-vs-tooltip`} effect="solid">
          <span>Vision Score per Minute</span>
        </ReactTooltip>
        <div data-tip data-for={`${champion_id}-vs-tooltip`}>
          <span>VS/M</span> :{' '}
          <span style={{fontWeight: 'bold'}}>{numeral(vspm).format('0.00')}</span>
        </div>
      </div>
    </div>
  )
}
