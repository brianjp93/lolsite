import {useState, useCallback, useMemo, useEffect} from 'react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {useChampions} from '../../hooks'
import ReactTooltip from 'react-tooltip'
import numeral from 'numeral'
import type {FullParticipantType, SummonerType, FrameType, ParticipantFrameType} from '../../types'
import {useTimelineIndex} from '../../stores'

type GraphType =
  | 'total_gold'
  | 'cs'
  | 'xp'
  | 'level'
  | 'total_damage_done_to_champions'
  | 'time_enemy_spent_controlled'
  | 'gold_per_second'
interface AugmentedParticipantFrame extends ParticipantFrameType {
  cs: number
}
interface AugmentedFrameType extends FrameType {
  participantframes: AugmentedParticipantFrame[]
}

function ChampionTimelines(props: {
  matchId: string
  theme: string
  my_part: FullParticipantType
  summoner: SummonerType
  participants: FullParticipantType[]
  timeline: AugmentedFrameType[]
  expanded_width: number
}) {
  const [participant_selection, setParticipantSelection] = useState(
    props.participants.map((item) => item._id),
  )
  const [graph_type, setGraphType] = useState<GraphType>('total_gold')
  const champions = useChampions()
  const [timelineIndex, setTimelineIndex] = useTimelineIndex(props.matchId)

  const image_width = 30
  const usable_width = props.expanded_width - 30
  const available_width = usable_width - props.participants.length * image_width
  const padding_pixels = available_width / props.participants.length
  const participants = useMemo(() => {
    return [
      ...props.participants.filter((participant) => participant.team_id === 100),
      ...props.participants.filter((participant) => participant.team_id === 200),
    ]
  }, [props.participants])
  const participant_ids = participants.map((participant: any) => participant._id)
  const colors = [
    '#d94630',
    '#d98d30',
    '#d9d330',
    '#90d930',
    '#3ca668',
    '#3ca69a',
    '#3c71a6',
    '#545acc',
    '#8c4fd6',
    '#d24fd6',
    '#f55fa0',
    '#994352',
  ]

  const getGraphBubbleInput = (_type: GraphType, displayName?: string, tooltip?: string) => {
    return (
      <div className="col s3">
        <label data-tip={tooltip} htmlFor={`${_type}-champion-graph`}>
          <input
            id={`${_type}-champion-graph`}
            onChange={() => setGraphType(_type)}
            type="radio"
            checked={graph_type === _type}
          />
          <span>{displayName || _type}</span>
        </label>
      </div>
    )
  }

  useEffect(() => {
    ReactTooltip.rebuild()
  }, [participants])

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {participants.map((participant, index) => {
          return (
            <ChampionImage
              key={`${participant._id}-champion-image`}
              is_me={participant._id === props.my_part._id}
              color={colors[index]}
              is_selected={participant_selection.indexOf(participant._id) >= 0}
              image_width={image_width}
              participant={participant}
              padding_pixels={padding_pixels}
              theme={props.theme}
              handleClick={() => {
                let new_selection = [...participant_selection]
                if (participant_selection.indexOf(participant._id) >= 0) {
                  new_selection = new_selection.filter((id) => id !== participant._id)
                } else {
                  new_selection.push(participant._id)
                }
                setParticipantSelection(new_selection)
              }}
            />
          )
        })}
      </div>

      <div className="row" style={{marginLeft: 0, marginRight: 0}}>
        <div className="col s6">
          <button
            onClick={useCallback(() => setParticipantSelection([]), [])}
            style={{width: '100%'}}
            className={`${props.theme} btn-small`}
          >
            Clear All
          </button>
        </div>
        <div className="col s6">
          <button
            onClick={useCallback(() => {
              let parts = participants.map((part) => part._id)
              setParticipantSelection(parts)
            }, [participants])}
            style={{width: '100%'}}
            className={`${props.theme} btn-small`}
          >
            Select All
          </button>
        </div>
      </div>

      <div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            onMouseMove={(props) => {
              if (props.activeTooltipIndex !== undefined) {
                let new_timeline_index = props.activeTooltipIndex
                setTimelineIndex(new_timeline_index)
              }
            }}
            margin={{
              left: -10,
              right: 20,
            }}
            data={props.timeline}
          >
            <CartesianGrid vertical={false} stroke="#777" strokeDasharray="4 4" />

            <XAxis
              hide={false}
              tickFormatter={(tickItem) => {
                var m = Math.round(tickItem / 1000 / 60)
                return `${m}m`
              }}
              dataKey="timestamp"
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(tick) => {
                return numeral(tick).format('0a')
              }}
            />

            {timelineIndex && (
              <ReferenceLine
                yAxisId="left"
                x={props.timeline[timelineIndex].timestamp}
                stroke="white"
                strokeWidth={2}
              />
            )}

            {participant_selection.map((id) => {
              let stroke = colors[participant_ids.indexOf(id)]
              const stroke_width = id !== props.my_part._id ? 1 : 3
              const stroke_type = graph_type === 'level' ? 'stepAfter' : 'monotone'
              const part = getParticipant(props.participants, id)
              if (!part) {
                return null
              }
              return (
                <Line
                  name={champions[part.champion_id]?.name}
                  key={`${id}-line-chart`}
                  isAnimationActive={false}
                  yAxisId="left"
                  type={stroke_type}
                  dot={false}
                  dataKey={(frame: AugmentedFrameType) => {
                    for (let part of frame.participantframes) {
                      if (part.participant_id === id) {
                        return part[graph_type]
                      }
                    }
                    return null
                  }}
                  stroke={stroke}
                  strokeWidth={stroke_width}
                />
              )
            })}
            <Tooltip
              itemSorter={(item: any) => -item.value}
              wrapperStyle={{zIndex: 10}}
              formatter={(value: any) => {
                let output
                if (graph_type === 'total_gold') {
                  output = `${numeral(value).format('0,0')} gold`
                } else {
                  output = value
                }
                return output
              }}
              labelFormatter={(label) => {
                let m = ''
                if (typeof label === 'number') {
                  m = Math.round(label / 1000 / 60).toString()
                }
                return `${m}m`
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="row" style={{marginLeft: 20, marginRight: 15}}>
        {getGraphBubbleInput('total_gold', 'Gold')}
        {getGraphBubbleInput('cs', 'CS')}
        {getGraphBubbleInput('xp', 'XP')}
        {getGraphBubbleInput('level', 'Level')}
        {getGraphBubbleInput('total_damage_done_to_champions', 'Champ DMG')}
        {getGraphBubbleInput(
          'time_enemy_spent_controlled',
          'CC Time',
          'I have no idea what the units of this is supposed to be.',
        )}
        {getGraphBubbleInput(
          'gold_per_second',
          'Gold/Sec',
          'Passive gold generation from support items?',
        )}
      </div>
    </div>
  )
}

function getParticipant(participants: FullParticipantType[], id: number) {
  for (let part of participants) {
    if (part._id === id) {
      return part
    }
  }
  return null
}

function ChampionImage(props: any) {
  const champions = useChampions()
  let image_style: any = {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: props.color,
    cursor: 'pointer',
    width: 30,
    height: 30,
  }
  if (!props.is_selected) {
    image_style = {
      ...image_style,
      opacity: 0.3,
    }
  }

  let vert_align: any = {}
  if (props.participant.champion?.image?.file_30) {
    vert_align.verticalAlign = 'top'
  }

  return (
    <div style={{padding: '0px 10px'}}>
      {champions[props.participant.champion_id].image.file_30 === '' && (
        <div onClick={props.handleClick} style={{...image_style}}>
          NA
        </div>
      )}
      {champions?.[props.participant?.champion_id]?.image?.file_30 && (
        <img
          onClick={props.handleClick}
          style={{...image_style}}
          aria-label={champions?.[props.participant.champion_id]?.name}
          src={champions?.[props.participant.champion_id]?.image?.file_30}
          alt={champions?.[props.participant.champion_id]?.name}
        />
      )}
    </div>
  )
}

export default ChampionTimelines
