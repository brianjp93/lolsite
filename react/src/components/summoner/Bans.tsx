import {useState} from 'react'
import type {BanType, ChampionType} from '../../types'
import {useChampions} from '../../hooks'
import {Popover} from 'react-tiny-popover'

export function BanList({bans}: {bans: BanType[]}) {
  const champions = useChampions()
  bans.sort((a, b) => a.pick_turn - b.pick_turn)
  return (
    <>
      {Object.keys(champions).length > 0 &&
        bans.map((ban) => {
          const champ = champions[ban.champion_id]
          return <BanItem champ={champ} key={`${ban.pick_turn}-${ban.champion_id}`}/>
        })
      }
    </>
  )
}


function BanItem({champ}: {champ: ChampionType}) {
  const [isOpen, setIsOpen] = useState(false)
  const IMG_SIZE = 30
  const MARGIN = 5
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
        }}
      >
        {champ && (
          <Popover
            isOpen={isOpen}
            positions={['top']}
            containerStyle={{zIndex: '11'}}
            content={() => {
              return <>{champ.name}</>
            }}
          >
            <img
              onClick={() => setIsOpen(!isOpen)}
              onMouseEnter={() => setIsOpen(true)}
              onMouseOut={() => setIsOpen(false)}
              src={champ.image.file}
              alt=""
              style={{height: IMG_SIZE, margin: MARGIN}}
            />
          </Popover>
        )}
      </div>
    </>
  )
}
