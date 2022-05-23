import {useEffect, useRef, useMemo, ReactNode, useCallback} from 'react'
import {useQuery} from 'react-query'
import {Link} from 'react-router-dom'
import Modal from 'react-modal'
import numeral from 'numeral'
import {formatDatetimeTime} from '../../constants/general'
import {MODALSTYLE} from '../summoner/Summoner'
import api from '../../api/api'

export function Spectate({
  region,
  summoner_id,
  queueConvert,
  closeModal,
}: {
  region: string
  summoner_id: string
  queueConvert: any
  closeModal: () => void
}) {
  const spectateQuery = useQuery(
    ['spectate', region, summoner_id],
    () => api.match.getSpectate({region, summoner_id}).then((x) => x.data),
    {retry: false},
  )
  const spectateData = spectateQuery.isSuccess ? spectateQuery.data : undefined

  const team100 = (spectateQuery.data?.participants || []).filter((x) => x.teamId === 100)
  const team200 = (spectateQuery.data?.participants || []).filter((x) => x.teamId === 200)

  const matchtime = useRef<HTMLElement>(null)

  const queue = useMemo(() => {
    if (spectateData === undefined) {
      return ''
    }
    try {
      return queueConvert[spectateData?.gameQueueConfigId].description
    } catch (error) {
      return `Queue ${spectateData.gameQueueConfigId}`
    }
  }, [spectateData, queueConvert])

  const getTopSoloPosition = (positions: any) => {
    let top = null
    if (positions !== null) {
      for (const pos of positions) {
        if (pos.queue_type === 'RANKED_SOLO_5x5') {
          return pos
        }
      }
    }
    return top
  }

  const getGameTime = useCallback(() => {
    if (spectateData === undefined) {
      return ''
    }
    const now = new Date().getTime()
    const ms = now - spectateData.gameStartTime
    const total_seconds = Math.round(ms / 1000)
    const minutes = Math.floor(total_seconds / 60)
    const seconds = total_seconds % 60
    return `${numeral(minutes).format('0')}:${numeral(seconds).format('00')}`
  }, [spectateData])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (matchtime.current === null) {
        return
      }
      matchtime.current.innerHTML = getGameTime()
    }, 1000)
    return () => {
      window.clearInterval(interval)
    }
  }, [getGameTime])

  const participantLine = (part: any) => {
    const pos = getTopSoloPosition(part.positions)
    const champion = part.champion || {}
    return (
      <div key={part.summonerId}>
        <hr />
        <div>
          <div style={{display: 'inline-block'}}>
            <img style={{height: 40, borderRadius: 4}} src={champion.image?.file_40} alt="" />
            <div>
              <small style={{}}>
                {summoner_id === part.summonerId && (
                  <span style={{verticalAlign: 'top'}}>{part.summonerName}</span>
                )}
                {summoner_id !== part.summonerId && (
                  <Link
                    target="_blank"
                    style={{verticalAlign: 'top'}}
                    className="dark"
                    to={`/${region}/${part.summonerName}/`}
                  >
                    {part.summonerName}
                  </Link>
                )}
              </small>{' '}
            </div>
          </div>
          {pos !== null && (
            <div style={{float: 'right', display: 'inline-block', textAlign: 'right'}}>
              <small className="dark pill">
                {pos.tier} {pos.rank}
              </small>
              <br />
              <small>
                {pos.wins}W / {pos.losses}L
              </small>
              <br />
              <small>{`${numeral((pos.wins / (pos.wins + pos.losses)) * 100).format(
                '0.0',
              )}%`}</small>
            </div>
          )}
        </div>
      </div>
    )
  }
  let width = 700
  if (spectateQuery.isLoading) {
    return <div style={{width: width}}>LOADING...</div>
  } else {
    if (spectateData) {
      return (
        <div style={{width: width, margin: '0px auto'}}>
          <div
            style={{
              display: 'inline-block',
              position: 'fixed',
              top: 60,
              right: 60,
            }}
          >
            <button onClick={closeModal} className={`btn-floating btn-large red`}>
              <i className="material-icons">close</i>
            </button>
          </div>
          <h5 style={{margin: 0, display: 'inline-block'}}>{queue}</h5>{' '}
          <span style={{float: 'right', paddingRight: 40}}>
            Match started at {formatDatetimeTime(spectateData.gameStartTime)} |{' '}
            <span style={{width: 50, display: 'inline-block'}} ref={matchtime}></span>
          </span>
          <div style={{height: 10}}></div>
          <div>
            <div style={{width: 350, display: 'inline-block'}}>
              {team100.map((part) => {
                return participantLine(part)
              })}
            </div>
            <div style={{width: 350, display: 'inline-block', paddingLeft: 15}}>
              {team200.map((part) => {
                return participantLine(part)
              })}
            </div>
          </div>
        </div>
      )
    } else {
      // not in a game
      return (
        <div style={{width: width}}>
          <h5 style={{margin: 0}}>This summoner is not currently in a game.</h5>
        </div>
      )
    }
  }
}

export function SpectateModal({
  isSpectateModalOpen,
  setIsSpectateModalOpen,
  queueConvert,
  region,
  summoner_id,
  children,
}: {
  isSpectateModalOpen: boolean
  setIsSpectateModalOpen: (x: boolean) => void
  queueConvert: any
  region: string
  summoner_id: string
  children: ReactNode
})  {
  const modalStyle = {
    overlay: {...MODALSTYLE.overlay},
    content: {...MODALSTYLE.content, display: 'flex'},
  }
  return (
    <div>
      <Modal
        style={modalStyle}
        isOpen={isSpectateModalOpen}
        onRequestClose={() => setIsSpectateModalOpen(false)}
      >
        <Spectate
          closeModal={() => setIsSpectateModalOpen(false)}
          queueConvert={queueConvert}
          region={region}
          summoner_id={summoner_id}
        />
      </Modal>
      <span style={{cursor: 'pointer'}} onClick={() => setIsSpectateModalOpen(true)}>
        {children}
      </span>
    </div>
  )
}
