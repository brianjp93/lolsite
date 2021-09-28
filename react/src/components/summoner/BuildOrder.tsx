import {useState, useEffect, useMemo, useCallback} from 'react'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'
import api from '../../api/api'
import toastr from 'toastr'
import type {
  FrameType,
  FullParticipantType,
  ItemPurchasedEventType,
  ItemSoldEventType,
  ItemUndoEventType,
  SummonerType,
} from '../../types'

type EventWithCount = (ItemPurchasedEventType | ItemSoldEventType | ItemUndoEventType) & {
  count?: number
}

interface PurchaseHistory {
  [key: number]: {[key: number]: EventWithCount[]}
}

function BuildOrder(props: {
  timeline?: FrameType[] | null
  theme: string
  expanded_width: number
  participants: FullParticipantType[]
  summoner: SummonerType
  my_part: any
  match_id: number
}) {
  const [participant_selection, setParticipantSelection] = useState(props.my_part?._id)
  const [purchase_history, setPurchaseHistory] = useState<PurchaseHistory>({})
  const [skills, setSkillsHistory] = useState<any>({})
  const [items, setItems] = useState<any>({})

  // build or skill
  const [display_page, setDisplayPage] = useState('build')

  const image_width = 30
  const usable_width = props.expanded_width - 30
  const available_width = usable_width - props.participants.length * image_width
  const padding_pixels = available_width / props.participants.length
  const participants = [
    ...props.participants.filter((participant) => participant.team_id === 100),
    ...props.participants.filter((participant) => participant.team_id === 200),
  ]

  const participant_data = useMemo(() => {
    for (var part of props.participants) {
      if (part._id === participant_selection) {
        return part
      }
    }
    return null
  }, [props.participants, participant_selection])

  // remove items which were purchased/sold and the player hit UNDO
  const remove_undos = (purchase_groups: {[key: string]: EventWithCount}[]) => {
    for (let i in purchase_groups) {
      let frame = purchase_groups[i]
      let remove_items: {[key: number]: number} = {}
      for (let key in frame) {
        let event = frame[key]
        if (event._type === 'ITEM_UNDO') {
          if (event.after_id === 0) {
            let id = event.before_id
            if (remove_items[id] === undefined) {
              remove_items[id] = 0
            }
            remove_items[id]++
          } else if (event.before_id === 0) {
            let id = event.after_id
            if (remove_items[id] === undefined) {
              remove_items[id] = 0
            }
            remove_items[id]--
          }
        }
      }

      // attempt to remove items which were either
      // purchased and undo or sold and undo
      for (let key in frame) {
        let event = frame[key]
        if (event._type === 'ITEM_PURCHASED') {
          let id = event.item_id
          if (remove_items[id] > 0) {
            if (event.count !== undefined) {
              event.count--
            }
            remove_items[id]--
          }
        }
      }

      let framecopy = {...frame}
      for (let key in frame) {
        let event = frame[key]
        if (event.count !== undefined && event.count <= 0) {
          delete framecopy[key]
        }
      }
      purchase_groups[i] = framecopy
    }
    return purchase_groups
  }

  const participant_groups = useMemo(() => {
    let groups = []
    if (purchase_history[participant_selection] !== undefined) {
      for (let i in purchase_history[participant_selection]) {
        let group = purchase_history[participant_selection][i]
        groups.push(group)
      }
    }

    let groups_with_count = []
    for (let group of groups) {
      let group_count: {[key: string]: EventWithCount} = {}
      for (let event of group) {
        let key: string
        if (event._type === 'ITEM_UNDO') {
          key = `${event.before_id}-${event.after_id}-${event.timestamp}`
        } else {
          key = `${event?.item_id}-${event.timestamp}`
        }
        if (group_count[key] === undefined) {
          event.count = 1
          group_count[key] = event
        } else {
          group_count[key].count = (group_count[key].count || 1) + 1
        }
      }
      groups_with_count.push(group_count)
    }
    groups_with_count = remove_undos(groups_with_count)
    return groups_with_count
  }, [purchase_history, participant_selection])

  // PURCHASE HISTORY EFFECT
  useEffect(() => {
    let purchase: {[key: number]: {[key: number]: Array<EventWithCount>}} = {}
    if (props.timeline) {
      for (let i = 0; i < props.timeline.length; i++) {
        let frame = props.timeline[i]
        for (let event of [
          ...(frame.itempurchaseevents as EventWithCount[]),
          ...(frame.itemundoevents as EventWithCount[]),
          ...(frame.itemsoldevents as EventWithCount[]),
        ]) {
          if (purchase[event.participant_id] === undefined) {
            purchase[event.participant_id] = {}
          }
          if (purchase[event.participant_id][i] === undefined) {
            purchase[event.participant_id][i] = []
          }
          purchase[event.participant_id][i].push(event)
        }
      }
      setPurchaseHistory(purchase)
    }
  }, [props.timeline])

  // SKILL LEVEL UP HISTORY
  useEffect(() => {
    let skills: any = {}
    if (props.timeline) {
      for (let i = 0; i < props.timeline.length; i++) {
        let frame = props.timeline[i]
        for (let event of frame.skilllevelupevents) {
          if (skills[event.participant_id] === undefined) {
            skills[event.participant_id] = []
          }
          skills[event.participant_id].push(event)
        }
      }
      setSkillsHistory(skills)
    }
  }, [props.timeline])

  // GET ITEMS
  useEffect(() => {
    let item_set = new Set()
    for (let i in purchase_history[participant_selection]) {
      let group = purchase_history[participant_selection][i]
      for (let event of group) {
        if (
          event._type !== 'ITEM_UNDO' &&
          items[event?.item_id] === undefined &&
          typeof event?.item_id === 'number'
        ) {
          item_set.add(event.item_id)
        }
      }
    }
    let item_list = [...item_set]
    if (item_list.length > 0) {
      api.data.getItem({item_list: item_list}).then((response) => {
        let new_items: any = {...items}
        for (let item of response.data.data) {
          new_items[item._id] = item
        }
        setItems(new_items)
      })
    }
  }, [participant_selection, purchase_history, items])

  let count = 0
  let lines = 1
  return (
    <div style={{marginLeft: 30}}>
      {participants.map((participant, _) => {
        return (
          <ChampionImage
            key={`${participant.puuid}-champion-image`}
            is_me={participant._id === props.my_part?._id}
            is_selected={participant._id === participant_selection}
            image_width={image_width}
            participant={participant}
            padding_pixels={padding_pixels}
            theme={props.theme}
            handleClick={() => {
              if (participant._id !== participant_selection) {
                setParticipantSelection(participant._id)
              }
            }}
          />
        )
      })}

      <div style={{marginTop: 5, marginBottom: 5}} className="row">
        <div className="col s6">
          <label htmlFor={`${props.match_id}-build-selection`}>
            <input
              id={`${props.match_id}-build-selection`}
              onChange={useCallback(() => setDisplayPage('build'), [])}
              type="radio"
              checked={display_page === 'build'}
            />
            <span>Build Order</span>
          </label>
        </div>
        <div className="col s6">
          <label htmlFor={`${props.match_id}-skill-selection`}>
            <input
              id={`${props.match_id}-skill-selection`}
              onChange={useCallback(() => setDisplayPage('skill'), [])}
              type="radio"
              checked={display_page === 'skill'}
            />
            <span>Skill Order</span>
          </label>
        </div>
      </div>

      {display_page === 'build' && (
        <div
          className="quiet-scroll"
          style={{marginTop: 5, overflowY: 'scroll', height: 300, width: 385}}
        >
          {participant_groups.map((group, key) => {
            let total_seconds = Object.values(group)[0].timestamp / 1000
            let minutes = Math.floor(total_seconds / 60)
            let seconds = Math.floor(total_seconds % 60)
            count++
            let div_style: Record<string, any> = {display: 'inline-block'}
            if (count > lines * 9) {
              lines++
              div_style = {display: 'block'}
            }
            return (
              <span key={`${props.match_id}-${key}`}>
                <div style={div_style}></div>
                <div style={{display: 'inline-block'}} key={key}>
                  {Object.values(group).filter((x) => x._type !== 'ITEM_UNDO').length > 0 && (
                    <div style={{display: 'block', color: 'grey', width: 50}}>
                      {minutes}:{numeral(seconds).format('00')}
                    </div>
                  )}
                  <div>
                    {Object.values(group).map((event, sub_key) => {
                      // let event = group[item_id]
                      if (event._type !== 'ITEM_UNDO' && items[event.item_id] !== undefined) {
                        let image_style = {}
                        let action = 'purchased'
                        if (event._type === 'ITEM_SOLD') {
                          action = 'sold'
                          image_style = {
                            ...image_style,
                            opacity: 0.3,
                            borderWidth: 3,
                            borderStyle: 'solid',
                            borderColor: 'darkred',
                          }
                        }
                        count++
                        let item_data = items[event.item_id]
                        let total_seconds = event.timestamp / 1000
                        let minutes = Math.floor(total_seconds / 60)
                        let seconds = Math.floor(total_seconds % 60)
                        return (
                          <div key={sub_key} style={{display: 'inline-block'}}>
                            <div
                              style={{
                                display: 'inline-block',
                                position: 'relative',
                              }}
                            >
                              <ReactTooltip
                                id={`${props.match_id}-${item_data._id}-${key}-${sub_key}-tt`}
                                effect="solid"
                              >
                                <h4 style={{marginBottom: 0, marginTop: 0}}>{item_data.name}</h4>

                                <div style={{marginBottom: 15}}>
                                  {action} at {minutes}:{numeral(seconds).format('00')}.
                                </div>

                                <div
                                  className="item-description-tt"
                                  style={{
                                    maxWidth: 500,
                                    wordBreak: 'normal',
                                    whiteSpace: 'normal',
                                    marginBottom: 0,
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: item_data.description,
                                  }}
                                ></div>
                              </ReactTooltip>
                              <img
                                data-tip
                                data-for={`${props.match_id}-${item_data._id}-${key}-${sub_key}-tt`}
                                style={{
                                  width: 30,
                                  borderRadius: 5,
                                  ...image_style,
                                }}
                                src={item_data.image.file_30}
                                alt=""
                              />
                              {(event.count || 1) > 1 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 20,
                                    background: 'white',
                                    color: 'black',
                                    textAlign: 'center',
                                    fontSize: 'smaller',
                                    borderRadius: 5,
                                  }}
                                >
                                  {event.count}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                    {key < participant_groups.length - 1 &&
                      Object.values(participant_groups[key + 1]).filter(
                        (x) => x._type !== 'ITEM_UNDO',
                      ).length > 0 && (
                        <span>
                          <i className="small material-icons">arrow_forward</i>
                        </span>
                      )}
                  </div>
                </div>
              </span>
            )
          })}
        </div>
      )}
      {display_page === 'skill' && participant_data && (
        <SkillLevelUp
          skills={skills[participant_selection]}
          selected_participant={participant_data}
          expanded_width={props.expanded_width}
        />
      )}
    </div>
  )
}

function ChampionImage(props: {
  is_me: boolean
  is_selected: boolean
  participant: FullParticipantType
  image_width: number
  padding_pixels: number
  theme: string
  handleClick: () => void
}) {
  let image_style: any = {
    cursor: 'pointer',
    width: 30,
    height: 30,
  }
  if (!props.is_selected) {
    image_style = {
      ...image_style,
      opacity: 0.3,
    }
  } else {
    image_style = {
      ...image_style,
      borderWidth: 3,
      borderColor: 'white',
      borderStyle: 'solid',
    }
  }

  let vert_align: any = {}
  let champ_image = props.participant.champion?.image?.file_30
  if (champ_image === undefined) {
    vert_align.verticalAlign = 'top'
  }
  return (
    <div style={{display: 'inline-block', paddingRight: props.padding_pixels, ...vert_align}}>
      {champ_image === undefined && (
        <div onClick={props.handleClick} style={{display: 'inline-block', ...image_style}}>
          NA
        </div>
      )}
      {champ_image !== undefined && (
        <img
          onClick={props.handleClick}
          style={{
            ...image_style,
          }}
          aria-label={props.participant.champion.name}
          src={props.participant.champion?.image?.file_30}
          alt=""
        />
      )}
    </div>
  )
}

function SkillLevelUp(props: {
  selected_participant: FullParticipantType
  expanded_width: number
  skills: any
}) {
  const [spells, setSpells] = useState<any>({})

  useEffect(() => {
    let params = {champion_id: props.selected_participant.champion._id}
    api.data
      .getChampionSpells(params)
      .then((response) => {
        let output: any = {}
        let data = response.data.data
        for (let i = 0; i < data.length; i++) {
          let spell = data[i]
          let letter = ['q', 'w', 'e', 'r'][i]
          output[letter] = spell
        }
        setSpells(output)
      })
      .catch((_) => {
        toastr.error('Error while getting champion abilities.')
      })
  }, [props.selected_participant])

  let div_width = (props.expanded_width - 65) / 18
  let div_height = 30
  return (
    <div>
      {props.skills !== undefined &&
        [...Array(19).keys()].map((num) => {
          const skill = props.skills[num - 1]
          return (
            <div key={num} style={{display: 'inline-block'}}>
              {['lvl', 'q', 'w', 'e', 'r'].map((skill_num, key) => {
                let output: any = '.'
                let div_style: any = {
                  height: div_height,
                  width: div_width,
                  borderStyle: 'solid',
                  borderColor: 'grey',
                  borderWidth: 1,
                }
                if (num === 0) {
                  div_style = {
                    height: div_height,
                    width: 30,
                    borderStyle: 'solid',
                    borderColor: 'grey',
                    borderWidth: 0,
                  }
                  if (['q', 'w', 'e', 'r'].indexOf(skill_num) >= 0) {
                    output = (
                      <span>
                        <ReactTooltip
                          id={`${props.selected_participant?._id}-${skill_num}-ability`}
                          effect="solid"
                        >
                          <div
                            style={{
                              maxWidth: 500,
                              wordBreak: 'normal',
                              whiteSpace: 'normal',
                            }}
                          >
                            {spells[skill_num] !== undefined && (
                              <div>
                                <div>
                                  <div
                                    style={{
                                      display: 'inline-block',
                                    }}
                                  >
                                    <img
                                      style={{
                                        height: 50,
                                        borderRadius: 8,
                                      }}
                                      src={spells[skill_num].image_url}
                                      alt=""
                                    />
                                  </div>
                                  <h4
                                    style={{
                                      display: 'inline-block',
                                      marginLeft: 10,
                                    }}
                                  >
                                    {spells[skill_num].name}
                                  </h4>
                                </div>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: spells[skill_num].description,
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </ReactTooltip>
                        <div
                          data-tip
                          data-for={`${props.selected_participant._id}-${skill_num}-ability`}
                          style={{
                            width: 30,
                            height: 30,
                            position: 'relative',
                          }}
                        >
                          {skill_num}

                          {spells[skill_num] !== undefined && (
                            <img
                              src={spells[skill_num].image_url}
                              alt=""
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 30,
                                borderStyle: 'solid',
                                borderColor: 'grey',
                                borderWidth: 2,
                              }}
                            />
                          )}
                        </div>
                      </span>
                    )
                  } else {
                    output = '.'
                  }
                } else if (skill_num === 'lvl') {
                  div_style = {
                    ...div_style,
                    borderStyle: 'none',
                    borderWidth: 0,
                  }
                  output = `${num}`
                } else if (skill !== undefined && skill.skill_slot === key) {
                  div_style = {
                    ...div_style,
                    textAlign: 'center',
                    background: '#196893',
                  }
                  output = skill_num
                } else {
                  output = '.'
                }
                return (
                  <div key={key} style={div_style}>
                    <span>{output}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
    </div>
  )
}

export default BuildOrder
