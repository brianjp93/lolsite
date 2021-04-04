import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import numeral from 'numeral'

// MAIN
function ChampionTimelines(props) {
    const [participant_selection, setParticipantSelection] = useState(
        props.participants.map(item => item._id),
    )
    const [graph_type, setGraphType] = useState('total_gold')

    const image_width = 30
    const usable_width = props.expanded_width - 30
    const available_width = usable_width - props.participants.length * image_width
    const padding_pixels = available_width / props.participants.length
    const participants = [
        ...props.participants.filter(participant => participant.team_id === 100),
        ...props.participants.filter(participant => participant.team_id === 200),
    ]
    const participant_ids = participants.map(participant => participant._id)
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

    return (
        <div>
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
                        handleClick={_ => {
                            let new_selection = [...participant_selection]
                            if (participant_selection.indexOf(participant._id) >= 0) {
                                new_selection = new_selection.filter(id => id !== participant._id)
                            } else {
                                new_selection.push(participant._id)
                            }
                            setParticipantSelection(new_selection)
                        }}
                    />
                )
            })}

            <div className="row" style={{ marginLeft: 0, marginRight: 0 }}>
                <div className="col s6">
                    <button
                        onClick={useCallback(() => setParticipantSelection([]), [])}
                        style={{ width: '100%' }}
                        className={`${props.theme} btn-small`}
                    >
                        Clear All
                    </button>
                </div>
                <div className="col s6">
                    <button
                        onClick={useCallback(() => {
                            let parts = participants.map(part => part._id)
                            setParticipantSelection(parts)
                        }, [participants])}
                        style={{ width: '100%' }}
                        className={`${props.theme} btn-small`}
                    >
                        Select All
                    </button>
                </div>
            </div>

            <div>
                <LineChart
                    margin={{
                        left: -10,
                        right: 20,
                    }}
                    width={usable_width}
                    height={400}
                    data={props.timeline}
                >
                    <CartesianGrid vertical={false} stroke="#777" strokeDasharray="4 4" />

                    <XAxis
                        hide={false}
                        tickFormatter={tickItem => {
                            var m = Math.round(tickItem / 1000 / 60)
                            return `${m}m`
                        }}
                        dataKey="timestamp"
                    />

                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        tickFormatter={tick => {
                            return numeral(tick).format('0a')
                        }}
                    />

                    {participant_selection.map(id => {
                        let stroke = colors[participant_ids.indexOf(id)]
                        let stroke_width = 3
                        if (id !== props.my_part._id) {
                            stroke_width = 1
                        }
                        let stroke_type = 'monotone'
                        if (graph_type === 'level') {
                            stroke_type = 'stepAfter'
                        }
                        return (
                            <Line
                                name={getParticipant(props.participants, id).champion.name}
                                key={`${id}-line-chart`}
                                isAnimationActive={false}
                                yAxisId="left"
                                type={stroke_type}
                                dot={false}
                                dataKey={frame => {
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
                        itemSorter={item => -item.value}
                        wrapperStyle={{ zIndex: 10 }}
                        formatter={(value) => {
                            let output
                            if (graph_type === 'total_gold') {
                                output = `${numeral(value).format('0,0')} gold`
                            } else {
                                output = value
                            }
                            return output
                        }}
                        labelFormatter={label => {
                            var m = Math.round(label / 1000 / 60)
                            return `${m}m`
                        }}
                    />
                </LineChart>
            </div>

            <div className="row" style={{ marginLeft: 20, marginRight: 15 }}>
                <div className="col s3">
                    <label htmlFor="gold-champion-graph">
                        <input
                            id="gold-champion-graph"
                            onChange={() => setGraphType('total_gold')}
                            type="radio"
                            checked={graph_type === 'total_gold'}
                        />
                        <span>Gold</span>
                    </label>
                </div>

                <div className="col s3">
                    <label htmlFor="cs-champion-graph">
                        <input
                            id="cs-champion-graph"
                            onChange={() => setGraphType('cs')}
                            type="radio"
                            checked={graph_type === 'cs'}
                        />
                        <span>CS</span>
                    </label>
                </div>

                <div className="col s3">
                    <label htmlFor="xp-champion-graph">
                        <input
                            id="xp-champion-graph"
                            onChange={() => setGraphType('xp')}
                            type="radio"
                            checked={graph_type === 'xp'}
                        />
                        <span>XP</span>
                    </label>
                </div>

                <div className="col s3">
                    <label htmlFor="level-champion-graph">
                        <input
                            id="level-champion-graph"
                            onChange={() => setGraphType('level')}
                            type="radio"
                            checked={graph_type === 'level'}
                        />
                        <span>Level</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
ChampionTimelines.propTypes = {
    my_part: PropTypes.object,
    summoner: PropTypes.object,
    timeline: PropTypes.array,
    participants: PropTypes.array,
    expanded_width: PropTypes.number,
    theme: PropTypes.string,
}

function getParticipant(participants, id) {
    for (let part of participants) {
        if (part._id === id) {
            return part
        }
    }
    return null
}

function ChampionImage(props) {
    let image_style = {
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

    let vert_align = {}
    if (props.participant.champion?.image?.file_30) {
        vert_align.verticalAlign = 'top'
    }

    return (
        <div style={{ display: 'inline-block', paddingRight: props.padding_pixels, ...vert_align }}>
            {props.participant.champion.image_url === '' && (
                <div onClick={props.handleClick} style={{ ...image_style }}>
                    NA
                </div>
            )}
            {props.participant?.champion?.image?.file_30 && (
                <img
                    onClick={props.handleClick}
                    style={{ ...image_style }}
                    aria-label={props.participant.champion.name}
                    src={props.participant.champion.image.file_30}
                    alt=""
                />
            )}
        </div>
    )
}
ChampionImage.propTypes = {
    is_selected: PropTypes.bool,
    participant: PropTypes.object,
    image_width: PropTypes.number,
    padding_pixels: PropTypes.number,
    theme: PropTypes.string,
}

export default ChampionTimelines
