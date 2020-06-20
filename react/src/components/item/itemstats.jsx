import React, { useEffect, useState, useCallback } from 'react'
import Latex from 'react-latex'
import Skeleton from '../general/Skeleton'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import Slider from 'rc-slider'
import numeral from 'numeral'
import { ArmorPenComparison } from './stats/armorpencomparison'
import { EffectiveHealth } from './stats/effectivehealth'

export const axis_label = {
    fill: '#a0a2b3',
    fontWeight: 'bold',
    textDecoration: 'underline',
}

export function ItemStatPage(props) {
    const theme = props.store.state.theme

    const card_styles = {
        width: 600,
        marginLeft: 'auto',
        marginRight: 'auto',
    }
    return (
        <Skeleton {...props}>
            <div className="row" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }} className="col l10 offset-l1">
                    <ArmorMagicResistEffectiveHealthCard style={card_styles} theme={theme} />
                    <ArmorCuttingCard style={card_styles} theme={theme} />
                </div>
            </div>
        </Skeleton>
    )
}

export function ArmorMagicResistEffectiveHealthCard(props) {
    const style = props.style === undefined ? {} : props.style
    const graph_width = 500
    const graph_height = 200

    return (
        <div style={{ ...style }}>
            <h5 style={{ marginTop: 0 }}>Effective Health</h5>
            <ArmorMagicResistEffectiveHealth height={graph_height} width={graph_width} />
            <div style={{ marginLeft: 80, marginTop: -20, color: '#8a8a8a' }}>
                <small>*Assuming a champion with 1000hp</small>
            </div>
            <div style={{ marginTop: 10 }}>
                Armor and MR increase effective health by the formula.
                <Latex displayMode>
                    {`$$\\rm Effective\\ health = \\left(1 + \\frac{Armor | MR}{100} \\right)\\times \\rm health$$`}
                </Latex>
            </div>

            <div style={{height: 10}}></div>
            <div style={{ position: 'relative', }} className="unselectable">
                <EffectiveHealth width={graph_width} height={400} />
            </div>

        </div>
    )
}

export function ArmorMagicResistEffectiveHealth(props) {
    const [data, setData] = useState([])
    const [health, setHealth] = useState(1000)

    const height = props.height
    const width = props.width

    const createData = useCallback(() => {
        let new_data = []
        for (let x = 10; x < 301; x += 4) {
            let elt = {
                armor: x,
                effectiveHealth: (1 + x / 100) * health,
            }
            new_data.push(elt)
        }
        return new_data
    }, [health])

    useEffect(() => {
        setData(createData())
    }, [createData])

    return (
        <>
            {data.length > 0 && (
                <div style={{ position: 'relative' }} className="unselectable">
                    <AreaChart height={height} width={width} data={data}>
                        <XAxis
                            label={{
                                value: 'Armor | MR',
                                style: axis_label,
                                position: 'insideBottomRight',
                                offset: 0,
                            }}
                            dataKey="armor"
                        />
                        <YAxis
                            label={{
                                position: 'insideBottomLeft',
                                value: 'Effective Health',
                                offset: 15,
                                style: axis_label,
                                angle:-90,
                            }}
                            dataKey="effectiveHealth" />
                        <Area type="monotone" dataKey="effectiveHealth" />
                    </AreaChart>
                </div>
            )}
        </>
    )
}

export function ArmorCutting(props) {
    const [data, setData] = useState([])

    const lethality = props.lethality === undefined ? 30 : props.lethality
    const armor_pen = props.armor_pen === undefined ? 25 : props.armor_pen
    const level = props.level === undefined ? 11 : props.level
    const lethality_color = props.lethality_color === undefined ? 'red' : props.lethality_color
    const armor_pen_color = props.armor_pen_color === undefined ? 'purple' : props.armor_pen_color

    const height = props.height
    const width = props.width

    const createData = useCallback(() => {
        let new_data = []
        let lethCut = lethality * (0.6 + (0.4 * level) / 18)
        for (let x = 0; x < 301; x += 4) {
            let elt = {
                enemyArmor: x,
                armorCutPen: x * armor_pen,
                armorCutLethality: lethCut,
            }
            new_data.push(elt)
        }
        return new_data
    }, [lethality, armor_pen, level])

    useEffect(() => {
        setData(createData())
    }, [createData])

    return (
        <>
            {data.length > 0 && (
                <div style={{ position: 'relative' }} className="unselectable">
                    <AreaChart height={height} width={width} data={data}>
                        <XAxis
                            label={{
                                value: 'Enemy Armor',
                                style: axis_label,
                                position: 'insideBottom',
                                offset: 0,
                            }}
                            dataKey="enemyArmor" />
                        <YAxis
                            label={{
                                value: 'Armor Negated',
                                style: axis_label,
                                position: 'insideBottomLeft',
                                offset: 15,
                                angle: -90,
                            }}
                            domain={['dataMin', 130]} />
                        <Area
                            stroke={armor_pen_color}
                            fill={armor_pen_color}
                            type="monotone"
                            dataKey="armorCutPen"
                        />
                        <Area
                            stroke={lethality_color}
                            fill={lethality_color}
                            type="monotone"
                            dataKey="armorCutLethality"
                        />
                        <Tooltip
                            labelFormatter={label => {
                                return `${label} enemy armor`
                            }}
                            itemSorter={item => -item.value}
                            formatter={(value, name) => {
                                value = numeral(value).format('0,0')
                                if (name === 'armorCutPen') {
                                    name = 'armor cut from lethality'
                                } else {
                                    name = 'armor cut from pen'
                                }
                                return [value, name]
                            }}
                        />
                    </AreaChart>
                </div>
            )}
        </>
    )
}
export function ArmorCuttingCard(props) {
    const style = props.style === undefined ? {} : props.style
    const [lethality, setLethality] = useState(30)
    const [armor_pen, setArmorPen] = useState(0.25)
    const [level, setLevel] = useState(18)

    const slider_div = { display: 'inline-block', width: '70%' }
    const label_style = { display: 'inline-block', width: '30%', textAlign: 'right' }
    const lethality_color = 'red'
    const armor_pen_color = 'purple'
    const graph_height = 200
    const graph_width = 500

    return (
        <div style={{ ...style }}>
            <h5 style={{ marginTop: 0 }}>Armor Cutting</h5>
            <ArmorCutting
                height={graph_height}
                width={graph_width}
                lethality={lethality}
                armor_pen={armor_pen}
                level={level}
                lethality_color={lethality_color}
                armor_pen_color={armor_pen_color}
            />
            <div style={{marginTop: 10}}>
                <div>
                    <div style={slider_div}>
                        <Slider
                            value={lethality}
                            onChange={setLethality}
                            trackStyle={{ backgroundColor: lethality_color }}
                            min={0}
                            max={60}
                            step={1}
                        />
                    </div>
                    <div style={label_style}>{lethality} Lethality</div>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={slider_div}>
                        <Slider
                            value={armor_pen}
                            onChange={setArmorPen}
                            trackStyle={{ backgroundColor: armor_pen_color }}
                            min={0}
                            max={0.35}
                            step={0.01}
                        />
                    </div>
                    <div style={label_style}>{numeral(armor_pen * 100).format('0')}% Armor Pen</div>
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={slider_div}>
                        <Slider value={level} onChange={setLevel} min={1} max={18} step={1} />
                    </div>
                    <div style={label_style}>Level {level}</div>
                </div>

                <div>
                    <div>
                        The amount of armor negated by <em>lethality</em> is given by.
                    </div>
                    <Latex displayMode={true}>
                        {`$$Armor\\ Negated = Lethality \\times \\left( 0.6 + 0.4 \\times \\frac{level}{18}\\right)$$`}
                    </Latex>
                </div>
                <div>
                    <div>Armor negated by % armor pen is more simply given by</div>
                    <Latex displayMode={true}>
                        {`$$Armor\\ Negated = Armor\\ Pen \\times Enemy\\ Armor$$`}
                    </Latex>
                </div>
            </div>

            <hr />
            <h6>% DMG Increase VS Enemy Armor</h6>
            <ArmorPenComparison height={300} width={500} level={level} />
            <div style={{ marginTop: 10 }}>
                <div style={slider_div}>
                    <Slider value={level} onChange={setLevel} min={1} max={18} step={1} />
                </div>
                <div style={label_style}>Level {level}</div>
            </div>
            <div
                style={{
                    display: 'inline-block',
                    marginTop: 15,
                }}
            >
                The graph above shows the % Damage increase (y-axis) you get from each item,
                depening on the enemy's armor (x-axis).
            </div>
        </div>
    )
}
