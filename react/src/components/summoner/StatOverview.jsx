import React, { Component } from 'react'
import {BarChart, Bar, XAxis, YAxis, Tooltip} from 'recharts'
import api from '../../api/api'
import numeral from 'numeral'


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

                'cs': 'total cs',
                'cspm': 'cs / min'
            },
        }

        this.toggle = this.toggle.bind(this)
        this.getData = this.getData.bind(this)
        this.getPart = this.getPart.bind(this)
        this.getDPM = this.getDPM.bind(this)
        this.getDPG = this.getDPG.bind(this)
        this.getParticipants = this.getParticipants.bind(this)
        this.getKP = this.getKP.bind(this)
        this.getDPD = this.getDPD.bind(this)
        this.getDTPD = this.getDTPD.bind(this)
        this.getCS = this.getCS.bind(this)
        this.getCSPM = this.getCSPM.bind(this)
    }
    componentDidUpdate(prevProps) {
        if (prevProps.is_expanded === false && this.props.is_expanded === true) {
            if (this.props.parent.state.participants === null) {
                this.getParticipants()
            }
        }
    }
    toggle(event) {
        var select_value = event.target.value
        var select = this.state.selected
        this.state.selected.has(select_value) ? select.delete(select_value): select.add(select_value)
        this.setState({selected: select})
    }
    getParticipants() {
        var data = {'match_id': this.props.parent.props.match.id}
        api.match.participants(data)
            .then(response => {
                this.props.parent.setState({participants: response.data.data})
            })
            .catch(error => {

            })
    }
    getData() {
        var team100 = this.props.parent.getTeam100()
        var team200 = this.props.parent.getTeam200()
        var parts = [...team100, ...team200]
        for (var i=0; i<parts.length; i++) {
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
        var minutes = this.props.parent.props.match.game_duration / 60
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
        var minutes = this.props.parent.props.match.game_duration / 60
        var cs = this.getCS(part)
        return cs / minutes
    }
    getKP(part) {
        var team_id = part.team_id
        var total = 0
        var parts
        if (team_id === 100) {
            parts = this.props.parent.getTeam100()
        }
        else (
            parts = this.props.parent.getTeam200()
        )
        for (var _part of parts) {
            total += _part.stats.kills
        }
        return ((part.stats.kills + part.stats.assists) / total) * 100
    }
    getPart(name) {
        var parts
        if (this.props.parent.state.participants !== null) {
            parts = this.props.parent.state.participants
        }
        else {
            parts = this.props.parent.props.match.participants
        }
        for (var part of parts) {
            if (part.summoner_name === name) {
                return part
            }
        }
        return {}
    }
    render() {
        // var theme = this.props.store.state.theme
        var outer_label_style = {display: 'block', marginLeft:-10}
        var label_style = {
            fontSize: 'smaller'
        }
        var summary_width = this.props.parent.state.summary_width
        var match = this.props.parent.props.match
        var team100 = this.props.parent.getTeam100()
        var team200 = this.props.parent.getTeam200()
        var parts = [...team100, ...team200]
        let menu_button_style = {
            display: 'block',
            padding: '0 5px',
            width: '85%',
            marginLeft: '7.5%',
            marginTop: 8,
        }
        return (
            <div>
                
                <div style={{
                    position: 'absolute',
                    top: 230,
                    width: 25,
                    height: 145,
                    left: summary_width + 2,
                    textAlign: 'center',
                    borderColor: 'grey',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    borderRadius: 5,
                    }}>
                    <button
                        style={{...menu_button_style, height: '88%'}}
                        className={`dark btn-small`}
                        onClick={() => this.setState({selected: new Set()})}>
                        <div
                            style={{
                                display: 'inline-block',
                                transform: 'rotate(-90deg) translate(0px, 20px)',
                                transformOrigin: 'bottom left 0',
                                verticalAlign: 'text-top'}} >
                            clear
                        </div>
                    </button>
                </div>

                <div
                    className='quiet-scroll'
                    onMouseEnter={() => this.props.store.setState({ignore_horizontal: true})}
                    onMouseLeave={() => this.props.store.setState({ignore_horizontal: false})}
                    style={{overflowY: 'scroll', height: 370, width:115, display: 'inline-block'}}>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage to{' '} <br/>
                            Champions

                            <hr />
                        </span>
                        <label style={outer_label_style} htmlFor={`${match._id}-total-dmg-to-champ-checkbox`}>
                            <input
                                value='total_damage_dealt_to_champions'
                                checked={this.state.selected.has('total_damage_dealt_to_champions')}
                                onChange={this.toggle}
                                id={`${match._id}-total-dmg-to-champ-checkbox`}
                                type="checkbox"/>
                            <span style={label_style}>Total</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-dpm`}>
                            <input
                                value='dpm'
                                checked={this.state.selected.has('dpm')}
                                onChange={this.toggle}
                                id={`${match._id}-dpm`}
                                type="checkbox"/>
                            <span title='Damage Per Minute' style={label_style}>Dmg / Min</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-dpg`}>
                            <input
                                value='dpg'
                                checked={this.state.selected.has('dpg')}
                                onChange={this.toggle}
                                id={`${match._id}-dpg`}
                                type="checkbox"/>
                            <span title='Damage Per Gold' style={label_style}>Dmg / Gold</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-dpd`}>
                            <input
                                value='dpd'
                                checked={this.state.selected.has('dpd')}
                                onChange={this.toggle}
                                id={`${match._id}-dpd`}
                                type="checkbox"/>
                            <span title='Damage Per Death' style={label_style}>Dmg / Death</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-kp`}>
                            <input
                                value='kp'
                                checked={this.state.selected.has('kp')}
                                onChange={this.toggle}
                                id={`${match._id}-kp`}
                                type="checkbox"/>
                            <span title='Kill Participation %' style={label_style}>KP</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-physical`}>
                            <input
                                value='physical_damage_dealt_to_champions'
                                checked={this.state.selected.has('physical_damage_dealt_to_champions')}
                                onChange={this.toggle}
                                id={`${match._id}-physical`}
                                type="checkbox"/>
                            <span style={label_style}>Physical</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-magic`}>
                            <input
                                value='magic_damage_dealt_to_champions'
                                checked={this.state.selected.has('magic_damage_dealt_to_champions')}
                                onChange={this.toggle}
                                id={`${match._id}-magic`}
                                type="checkbox"/>
                            <span style={label_style}>Magic</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-true`}>
                            <input
                                value='true_damage_dealt_to_champions'
                                checked={this.state.selected.has('true_damage_dealt_to_champions')}
                                onChange={this.toggle}
                                id={`${match._id}-true`}
                                type="checkbox"/>
                            <span style={label_style}>True</span>
                        </label>
                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage to{' '} <br/>
                            Structures
                            <hr />
                        </span>

                        <label style={outer_label_style} htmlFor={`${match._id}-turrets`}>
                            <input
                                value='damage_dealt_to_turrets'
                                checked={this.state.selected.has('damage_dealt_to_turrets')}
                                onChange={this.toggle}
                                id={`${match._id}-turrets`}
                                type="checkbox"/>
                            <span style={label_style}>Turrets</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-objectives`}>
                            <input
                                value='damage_dealt_to_objectives'
                                checked={this.state.selected.has('damage_dealt_to_objectives')}
                                onChange={this.toggle}
                                id={`${match._id}-objectives`}
                                type="checkbox"/>
                            <span style={label_style}>Objectives</span>
                        </label>
                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Damage Taken{' '} <br/>
                            and Healed
                            <hr />
                        </span>

                        <label style={outer_label_style} htmlFor={`${match._id}-healing`}>
                            <input
                                value='total_heal'
                                checked={this.state.selected.has('total_heal')}
                                onChange={this.toggle}
                                id={`${match._id}-healing`}
                                type="checkbox"/>
                            <span style={label_style}>Healing Done</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-damage_taken`}>
                            <input
                                value='total_damage_taken'
                                checked={this.state.selected.has('total_damage_taken')}
                                onChange={this.toggle}
                                id={`${match._id}-damage_taken`}
                                type="checkbox"/>
                            <span style={label_style}>Damage Taken</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-dtpd`}>
                            <input
                                value='dtpd'
                                checked={this.state.selected.has('dtpd')}
                                onChange={this.toggle}
                                id={`${match._id}-dtpd`}
                                type="checkbox"/>
                            <span title='Damage Taken Per Death' style={label_style}>Dmg / Death</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-self_mitigated_damage`}>
                            <input
                                value='damage_self_mitigated'
                                checked={this.state.selected.has('damage_self_mitigated')}
                                onChange={this.toggle}
                                id={`${match._id}-self_mitigated_damage`}
                                type="checkbox"/>
                            <span style={label_style}>Self Mitigated</span>
                        </label>
                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Vision
                            <hr />
                        </span>
                        <label style={outer_label_style} htmlFor={`${match._id}-vision_score`}>
                            <input
                                value='vision_score'
                                checked={this.state.selected.has('vision_score')}
                                onChange={this.toggle}
                                id={`${match._id}-vision_score`}
                                type="checkbox"/>
                            <span style={label_style}>Vision Score</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-wards_placed`}>
                            <input
                                value='wards_placed'
                                checked={this.state.selected.has('wards_placed')}
                                onChange={this.toggle}
                                id={`${match._id}-wards_placed`}
                                type="checkbox"/>
                            <span style={label_style}>Wards Placed</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-wards_killed`}>
                            <input
                                value='wards_killed'
                                checked={this.state.selected.has('wards_killed')}
                                onChange={this.toggle}
                                id={`${match._id}-wards_killed`}
                                type="checkbox"/>
                            <span style={label_style}>Wards Killed</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-vision_wards_bought_in_game`}>
                            <input
                                value='vision_wards_bought_in_game'
                                checked={this.state.selected.has('vision_wards_bought_in_game')}
                                onChange={this.toggle}
                                id={`${match._id}-vision_wards_bought_in_game`}
                                type="checkbox"/>
                            <span style={label_style}>Control Wards</span>
                        </label>
                    </div>

                    <div>
                        <span style={{fontSize:'small'}}>
                            Minions and <br/>
                            Monsters
                            <hr />
                        </span>

                        <label style={outer_label_style} htmlFor={`${match._id}-cs`}>
                            <input
                                value='cs'
                                checked={this.state.selected.has('cs')}
                                onChange={this.toggle}
                                id={`${match._id}-cs`}
                                type="checkbox"/>
                            <span style={label_style}>Total CS</span>
                        </label>

                        <label style={outer_label_style} htmlFor={`${match._id}-cspm`}>
                            <input
                                value='cspm'
                                checked={this.state.selected.has('cspm')}
                                onChange={this.toggle}
                                id={`${match._id}-cspm`}
                                type="checkbox"/>
                            <span style={label_style}>CS / Min</span>
                        </label>
                    </div>


                    <div style={{marginBottom: 80}}></div>

                </div>


                <div style={{position: 'absolute', top: 26, bottom: 0, left: summary_width + 155, zIndex:5}}>
                    
                    {parts.map(part => {
                        return (
                            <div key={`${match._id}-${part._id}`} style={{height:30, width:30, paddingBottom: 33}}>
                                <img title={part.summoner_name} style={{height:20}} src={part.champion.image_url} alt={part.champion.name}/>
                            </div>
                        )
                    })}

                </div>

                {this.props.parent.state.is_expanded &&
                    <div style={{display: 'inline-block', marginLeft: summary_width - 254}}>
                        <BarChart layout='vertical' width={235} height={370} data={this.getData()}>
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
                            <Tooltip formatter={(value, name, props) => {
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
                                    <Bar key={`${key}-bar`} dataKey={key} fill="#5e7ca7" />
                                )
                            })}
                        </BarChart>
                    </div>
                }
            </div>
        )
    }
}

export default StatOverview