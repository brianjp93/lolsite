import type {BanType} from '../../types'
import {useChampions} from '../../hooks'

export function BanList({bans}: {bans: BanType[]}) {
  const champions = useChampions()
  const IMG_SIZE = 30
  const MARGIN = 5
  return (
    <>
      {Object.keys(champions).length > 0 &&
        bans.map((ban) => {
          return (
            <>
              <div
                style={{
                  display: 'inline-block',
                  width: IMG_SIZE + MARGIN + MARGIN,
                  height: IMG_SIZE + MARGIN + MARGIN,
                  backgroundColor: 'grey',
                  margin: MARGIN,
                  verticalAlign: 'bottom',
                }}>
                {champions[ban.champion_id] &&
                  <img src={champions[ban.champion_id].image.file} alt="" style={{height: IMG_SIZE, margin: MARGIN}} />
                }
              </div>
            </>
          )
        })}
    </>
  )
}
