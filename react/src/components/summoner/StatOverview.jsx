import React, { Component } from 'react'
import {BarChart, Bar, XAxis, YAxis, Tooltip, Cell} from 'recharts'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'


class StatOverview extends Component {
    constructor(props) {
        super(props)

        this.state = {
            selected: new Set(['total_damage_dealt_to_champions']),
            convert: {
                'total_damage_dealt_to_champions': 'total',
                'damage_self_mitigated': 'self mitigated',
                'physical_damage_dealt_to_champions': 'physical dealt',
                'magic_damage_dealt_to_champions': 'magic dealt',
                'true_damage_dealt_to_champions': 'true dealt',
                'damage_dealt_to_turrets': 'turret damage',
                'damage_dealt_to_objectives': 'objective damage',
                'total_heal': 'healing',
                'total_damage_taken': 'damage taken',
                'vision_score': 'vision score',
                'wards_placed': 'wards placed',
                'wards_killed': 'wards killed',
                'vision_wards_bought_in_game': 'control wards',
                'dpd': 'dmg / death',
                'dtpd': 'dmg taken / death',
                'time_ccing_others': 'time ccing others',

                'cs': 'total cs',
                'cspm': 'cs / min'
            },
        }

        this.toggle = this.toggle.bind(this)
        this.getData = this.getData.bind(this)
        this.getPart = this.getPart.bind(this)
        this.getDPM = this.getDPM.bind(this)
        this.getDPG = this.getDPG.bind(this)
        this.getKP = this.getKP.bind(this)
        this.getDPD = this.getDPD.bind(this)
        this.getDTPD = this.getDTPD.bind(this)
        this.getCS = this.getCS.bind(this)
        this.getCSPM = this.getCSPM.bind(this)
        this.getBarGraphStat = this.getBarGraphStat.bind(this)
        this.getTeam = this.getTeam.bind(this)
    }
    toggle(event) {
        var select_value = event.target.value
        var select = this.state.selected
        // this.state.selected.has(select_value) ? select.delete(select_value): select.add(select_value)
        select.clear()
        select.add(select_value)
        this.setState({selected: select})
    }
    getTeam(num) {
        return this.props.participants.filter(item => item.team_id === num)
    }
    getData() {
        let team100 = this.getTeam(100)
        let team200 = this.getTeam(200)
        let parts = [...team100, ...team200]
        for (let i=0; i<parts.length; i++) {
            parts[i] = {...parts[i], ...parts[i].stats}

            parts[i].dpm = this.getDPM(parts[i])
            parts[i].dpg = this.getDPG(parts[i])
            parts[i].kp = this.getKP(parts[i])
            parts[i].dpd = this.getDPD(parts[i])
            parts[i].dtpd = this.getDTPD(parts[i])
            parts[i].cs = this.getCS(parts[i])
            parts[i].cspm = this.getCSPM(parts[i])
        }
        return parts
    }
    getDPM(part) {
        let minutes = this.props.match.game_duration / 60
        return part.total_damage_dealt_to_champions / minutes
    }
    getDPG(part) {
        return part.total_damage_dealt_to_champions / part.gold_earned
    }
    getDPD(part) {
        var deaths = part.deaths
        if (deaths < 1) {
            deaths = 1
        }
        return part.total_damage_dealt_to_champions / deaths
    }
    getDTPD(part) {
        var deaths = part.deaths
        if (deaths < 1) {
            deaths = 1
        }
        return part.total_damage_taken / deaths
    }
    getCS(part) {
        return part.stats.total_minions_killed + part.stats.neutral_minions_killed
    }
    getCSPM(part) {
        var minutes = this.props.match.game_duration / 60
        var cs = this.getCS(part)
        return cs / minutes
    }
    getKP(part) {
        var team_id = part.team_id
        var total = 0
        var parts
        if (team_id === 100) {
            parts = this.getTeam(100)
        }
        else (
            parts = this.getTeam(200)
        )
        for (var _part of parts) {
            total += _part.stats.kills
        }
        return ((part.stats.kills + part.stats.assists) / total) * 100
    }
    getPart(name) {
        var parts
        if (this.props.participants !== null) {
            parts = this.props.participants
        }
        else {
            parts = this.props.participants
        }
        for (var part of parts) {
            if (part.summoner_name === name) {
                return part
            }
        }
        return {}
    }
    getBarGraphStat(title, tooltip, value) {
        var match = this.props.match
        var outer_label_style = {display: 'block', marginLeft:-10}
        var label_style = {
            fontSize: 'smaller'
        }
        return (
            <span>
                <ReactTooltip
                    id={`${value}-tooltip`}
                    effect='solid'>
                    <span>{tooltip}</span>
                </ReactTooltip>
                <label
                    data-tip
                    data-for={`${value}-tooltip`}
                    style={outer_label_style}
                    htmlFor={`${value}-${match._id}`}>
                    <input
                        value={value}
                        checked={this.state.selected.has(value)}
                        onChange={this.toggle}
                        id={`${value}-${match._id}`}
                        type="checkbox"/>
                    <span style={label_style}>{title}</span>
                </label>
            </span>
        )
    }
    render() {
        // let summary_width = 500
        let match = this.props.match
        let team100 = this.getTeam(100)
        let team200 = this.getTeam(200)
        let parts = [...team100, ...team200]
        let bargraph_height = 420

        return (
            <div
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 700,
                    }}>
                <div
                    className='quiet-scroll'
                    style={{
                        overflowY: 'scroll', height: 420, width:115, display: 'inline-block'
                    }}>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage to{' '} <br/>
                            Champions

                            <hr />
                        </span>

                        {this.getBarGraphStat('Total', 'Total Damage to Champions', 'total_damage_dealt_to_champions')}
                        {this.getBarGraphStat('Dmg / Min', 'Damage Per Minute', 'dpm')}
                        {this.getBarGraphStat('Dmg / Gold', 'Damage Per Gold', 'dpg')}
                        {this.getBarGraphStat('Dmg / Death', 'Damage Per Death', 'dpd')}
                        {this.getBarGraphStat('KP', 'Kill Participation', 'kp')}
                        {this.getBarGraphStat('Physical', 'Physical Damage to Champions', 'physical_damage_dealt_to_champions')}
                        {this.getBarGraphStat('Magic', 'Magic Damage to Champions', 'magic_damage_dealt_to_champions')}
                        {this.getBarGraphStat('True', 'True Damage to Champions', 'true_damage_dealt_to_champions')}
                        {this.getBarGraphStat('CC Time', 'Time CCing Others', 'time_ccing_others')}

                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage to{' '} <br/>
                            Structures
                            <hr />
                        </span>

                        {this.getBarGraphStat('Turrets', 'Damage Dealt to Turrets', 'damage_dealt_to_turrets')}
                        {this.getBarGraphStat('Objectives', 'Damage Dealt to Objectives', 'damage_dealt_to_objectives')}

                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage Taken{' '} <br/>
                            and Healed
                            <hr />
                        </span>

                        {this.getBarGraphStat('Healing Done', 'Healing Done', 'total_heal')}
                        {this.getBarGraphStat('Damage Taken', 'Total Damage Taken', 'total_damage_taken')}
                        {this.getBarGraphStat('Dmg / Death', 'Damage Taken Per Death', 'dtpd')}
                        {this.getBarGraphStat('Self Mitigated', 'Damage Self Mitigated', 'damage_self_mitigated')}

                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Vision
                            <hr />
                        </span>

                        {this.getBarGraphStat('Vision Score', 'Vision Score', 'vision_score')}
                        {this.getBarGraphStat('Wards Placed', 'Wards Placed', 'wards_placed')}
                        {this.getBarGraphStat('Wards Killed', 'Wards Killed', 'wards_killed')}
                        {this.getBarGraphStat('Control Wards', '# of Control Wards purchased', 'vision_wards_bought_in_game')}

                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Minions and <br/>
                            Monsters
                            <hr />
                        </span>

                        {this.getBarGraphStat('Total CS', 'Total CS', 'cs')}
                        {this.getBarGraphStat('CS / Min', 'CS Per Minute', 'cspm')}

                    </div>


                    <div style={{marginBottom: 80}}></div>

                </div>


                <div style={{position: 'absolute', top: 12, left: 140, zIndex:5, marginTop: (10 - parts.length) * 2.6}}>
                    {parts.map(part => {
                        var heights = (bargraph_height - 40) / parts.length
                        return (
                            <div key={`${match._id}-${part._id}`} style={{height:heights, width:30}}>
                                <img title={part.summoner_name} style={{height:20}} src={part.champion.image.file_30} alt={part.champion.name}/>
                            </div>
                        )
                    })}

                </div>

                <div style={{display: 'inline-block', marginLeft: 50}}>
                    <BarChart layout='vertical' width={500} height={bargraph_height} data={this.getData()}>
                        <YAxis
                            width={0}
                            type='category'
                            dataKey="summoner_name"
                            interval={0}
                            tickFormatter={() => ''}
                            />
                        <XAxis
                            tickFormatter={(value) => {
                                if (value.toString().indexOf('.') >= 0) {
                                    return numeral(value).format('0,0.00')
                                }
                                else {
                                    return numeral(value).format('0,0')
                                }
                            }}
                            domain={[0, 'dataMax']} type='number'/>
                        <Tooltip formatter={(value, name, _) => {
                            var convert = this.state.convert
                            if (convert[name] !== undefined) {
                                name = convert[name]
                            }

                            if (value.toString().indexOf('.') >= 0) {
                                value = numeral(value).format('0,0.00')
                            }
                            else {
                                value = numeral(value).format('0,0')
                            }
                            return [value, name]
                        }} />
                        {[...this.state.selected].map((key) => {
                            return (
                                <Bar key={`${key}-bar`} dataKey={key} >
                                    {this.getData().map(part => {
                                        let mypart = this.props.mypart
                                        if (part.puuid === mypart.puuid) {
                                            return <Cell key={`${match.id}-${part._id}-cell`} fill='#a7bed0' />
                                        }
                                        else if (part.team_id === mypart.team_id) {
                                            return <Cell key={`${match.id}-${part._id}-cell`} fill="#437296" />
                                        }
                                        else if (part.team_id !== mypart.team_id) {
                                            return <Cell key={`${match.id}-${part._id}-cell`} fill="#954e4e" />
                                        }
                                        else {
                                            return <Cell key={`${match.id}-${part._id}-cell`} fill="#5e7ca7" />
                                        }
                                    })}
                                </Bar>
                            )
                        })}
                    </BarChart>
                </div>
            </div>
        )
    }
}

export default StatOverview
