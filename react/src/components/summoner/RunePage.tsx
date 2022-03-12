import React, { useState, useEffect, ReactNode, CSSProperties, useRef } from 'react'
import {Popover} from 'react-tiny-popover'
import numeral from 'numeral'
import {StatModTable} from './StatMod'
import {useRunes} from '../../hooks'
import type { FullParticipantType, BasicMatchType, RuneType } from '../../types'

import RUNES from '../../constants/runes'

export function RunePage({mypart, participants, match, matchCardHeight}: {mypart: any, participants: FullParticipantType[], match: BasicMatchType, matchCardHeight: number}) {
  const [selectedPart, setSelectedPart] = useState<FullParticipantType | undefined>()
  const version = `${match.major}${match.minor}`
  const runes = useRunes(version)

  const getPerks = (part: FullParticipantType) => {
    let perks: {id: string, var1: string, var2: string, var3: string}[] = []
    if (!part && selectedPart) {
      part = selectedPart
    }
    else if (part === null) {
      return []
    }
    for (var i = 0; i <= 5; i++) {
      const perk = {
        id: part.stats[`perk_${i}` as keyof typeof part.stats],
        var1: part.stats[`perk_${i}_var_1` as keyof typeof part.stats],
        var2: part.stats[`perk_${i}_var_2` as keyof typeof part.stats],
        var3: part.stats[`perk_${i}_var_3` as keyof typeof part.stats],
      }
      if (perk.id !== 0) {
        perks.push(perk)
      }
    }
    return perks
  }

  const partSelection = () => {
    return participants.map((part) => {
      let select_style: React.CSSProperties = {
        height: 30,
        width: 30,
        cursor: 'pointer',
      }
      const is_selected = selectedPart && part._id === selectedPart._id
      if (is_selected) {
        select_style = {
          ...select_style,
          borderStyle: 'solid',
          borderWidth: 3,
          borderColor: 'white',
        }
      } else {
        select_style = {
          ...select_style,
          opacity: 0.4,
        }
      }
      return (
        <div key={`${match.id}-${part.id}-rune-champ-image`}>
          {part.champion.image_url === '' && (
            <div
              title={part.summoner_name}
              onClick={() => setSelectedPart(part)}
              style={{...select_style}}
            >
              NA
            </div>
          )}
          {part.champion.image.file_30 !== '' && (
            <img
              title={part.summoner_name}
              onClick={() => setSelectedPart(part)}
              style={{...select_style}}
              src={part.champion.image.file_30}
              alt=""
            />
          )}
        </div>
      )
    })
  }

  useEffect(() => {
    if (!participants) {
      return
    }
    for (const part of participants) {
      if (part._id === mypart._id) {
        setSelectedPart(part)
      }
    }
  }, [mypart, participants])

    const rune_stat_height = (matchCardHeight - 20) / 6
    return (
      <div>
        <div
          style={{
            marginRight: 20,
            display: 'inline-block',
            marginLeft: 35,
            verticalAlign: 'top',
          }}
        >
          {partSelection()}
        </div>
        {selectedPart !== undefined &&
        <div style={{display: 'inline-block'}}>
          {getPerks(selectedPart).map((perk) => {
            const rune = runes[perk.id as unknown as keyof typeof runes]
            const rune_etc = RUNES.data[perk.id as keyof typeof RUNES.data]
            if (rune && rune_etc && rune_etc.perkFormat) {
              return (
                <div key={`${match.id}-${perk.id}`} style={{height: rune_stat_height}}>
                  <div style={{display: 'inline-block'}}>
                    <RuneTooltip rune={rune} style={{display: 'inline-block'}}>
                      <img style={{height: 40, paddingRight: 10}} src={rune.image_url} alt="" />
                    </RuneTooltip>

                    <div
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'top',
                      }}
                    >
                      {rune_etc.perkFormat.map((perk_format, j) => {
                        const desc = rune_etc.perkDesc[j]
                        return (
                          <div style={{lineHeight: 1}} key={`${match._id}-${j}`}>
                            <div
                              style={{
                                display: 'inline-block',
                                width: 200,
                              }}
                            >
                              {desc}
                            </div>
                            <div
                              style={{
                                display: 'inline-block',
                                fontWeight: 'bold',
                              }}
                            >
                              {perk_format
                                .replace('{0}', perk[`var${j + 1}` as keyof typeof perk])
                                .replace('{1}', numeral(perk[`var${j + 2}` as keyof typeof perk]).format('00'))
                                .replace('{2}', perk[`var${j + 2}` as keyof typeof perk])}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            } else {
              if (rune) {
                return (
                  <div key={`${match.id}-${perk.id}`}>
                    <div>{rune._id}</div>
                  </div>
                )
              } else {
                return <div key={`${match.id}-${perk.id}`}>{perk.id}</div>
              }
            }
          })}

          {getPerks(selectedPart).length === 0 && (
            <div style={{textAlign: 'center', textDecoration: 'underline'}}>No runes set</div>
          )}
        </div>
        }
        {selectedPart && (
          <div style={{display: 'inline-block', margin: 20, verticalAlign: 'top'}}>
            <StatModTable participant={selectedPart} />
          </div>
        )}
      </div>
    )
}

export function RuneTooltip({rune, style, children}: {rune: RuneType, style: CSSProperties, children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(x => !x)
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Popover
      isOpen={isOpen}
      positions={['top']}
      containerStyle={{zIndex: '11'}}
      content={
        <div>
          <h5 style={{textDecoration: 'underline', marginTop: -5}}>{rune.name}</h5>

          <div dangerouslySetInnerHTML={{__html: rune.long_description}}></div>
        </div>
      }
    >
      <div
        ref={ref}
        style={style}
        onClick={toggle}
        onMouseOver={() => setIsOpen(true)}
        onMouseOut={() => setIsOpen(false)}
      >
        {children}
      </div>
    </Popover>
  )
}
