import {useRef} from 'react'
import {fadeIn, fadeOut} from '../general/helpers'
import { useQuery } from 'react-query';
import api from '../../api/api'
import Skeleton from '../general/Skeleton'
import SummonerSearchField from '../summoner/SummonerSearchField'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function HomeV2({store}: {store: any}) {
  const quote = useRef<HTMLQuoteElement>(null)
  const FADETIME = 1500
  const MESSAGE_TIME = 20

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

  const quoteQuery = useQuery(
    ['inspirational-quote'],
    () => api.fun.getInspirationalMessage({random: true}).then(async (response) => {
      quoteFadeOut()
      await sleep(FADETIME)
      quoteFadeIn()
      return response.data.message
    }),
    {refetchInterval: MESSAGE_TIME * 1000, refetchOnWindowFocus: false}
  )

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
              title={quoteQuery.data?.hidden_message}
              style={{marginTop: 0, marginBottom: 0}}
              ref={quote}
              className={`${store.state.theme}`}
            >
              <span>{quoteQuery.data?.message}</span>
              {['', undefined].indexOf(quoteQuery.data?.author) === -1 && (
                <span>
                  <br />
                  <small>- {quoteQuery.data?.author}</small>
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
