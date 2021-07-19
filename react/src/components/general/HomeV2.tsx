import {useState, useEffect, useRef, useCallback} from 'react'
import api from '../../api/api'
import Skeleton from '../general/Skeleton'
import SummonerSearchField from '../summoner/SummonerSearchField'

const fadeIn = async (elt: HTMLElement, time: number) => {
  let newOpacity = `0%`
  elt.style.opacity = newOpacity
  const time_per_changetime = time / 100
  for (let i = 1; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, time_per_changetime))
    newOpacity = `${i}%`
    elt.style.opacity = newOpacity
  }
  elt.style.opacity = '100%'
}

const fadeOut = async (elt: HTMLElement, time: number) => {
  elt.style.opacity = '100%'
  const time_per_changetime = time / 100
  let newOpacity = `${100}%`
  for (let i = 1; i <= 100; i++) {
    await new Promise((r) => setTimeout(r, time_per_changetime))
    newOpacity = `${100 - i}%`
    elt.style.opacity = newOpacity
  }
  elt.style.opacity = '0%'
}

export function HomeV2({store}: {store: any}) {
  const [message, setMessage] = useState<any>()
  const quote = useRef<HTMLElement>(null)
  const FADETIME = 1500
  const MESSAGE_TIME = 10

  const quoteFadeIn = (callback?: () => void) => {
    if (quote.current) {
      fadeIn(quote.current, FADETIME)
      if (callback !== undefined) {
        setTimeout(callback, FADETIME)
      }
    }
  }

  const quoteFadeOut = (callback?: () => void) => {
    if (quote.current) {
      fadeOut(quote.current, FADETIME)
      if (callback !== undefined) {
        setTimeout(callback, FADETIME)
      }
    }
  }

  const getInspirationalMessage = useCallback(() => {
    api.fun.getInspirationalMessage({random: true}).then((response) => {
      quoteFadeOut(() => {
        setMessage(response.data.message)
        quoteFadeIn()
      })
    })
  }, [message])

  useEffect(() => {
    getInspirationalMessage()
  }, [])

  // set and clear interval
  useEffect(() => {
    let interval = window.setInterval(getInspirationalMessage, MESSAGE_TIME * 1000)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <Skeleton store={store}>
      <div className="row">
        <div style={{display: 'flex'}}>
          <img
            style={{maxWidth: 400, margin: 'auto'}}
            src={`${store.state.static}general/hardstuck-by-hand_2.png`}
            alt=""
          />
        </div>
        <div style={{height: 100, display: 'flex'}} className="col m3 offset-m4">
          <span style={{marginTop: 'auto', marginBottom: 'auto'}}>
            <blockquote
              title={message?.hidden_message}
              style={{marginTop: 0, marginBottom: 0}}
              ref={quote}
              className={`${store.state.theme}`}
            >
              <span>{message?.message}</span>
              {['', undefined].indexOf(message?.author) === -1 && (
                <span>
                  <br />
                  <small>- {message?.author}</small>
                </span>
              )}
            </blockquote>
          </span>
        </div>
      </div>
      <div style={{padding: '0px 10px'}} className="row">
        <div className="col l6 offset-l3 m8 offset-m2">
          <SummonerSearchField store={store} />
        </div>
      </div>
    </Skeleton>
  )
}
