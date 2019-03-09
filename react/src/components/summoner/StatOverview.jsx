import React, { Component } from 'react'
import {BarChart, Bar, XAxis, YAxis} from 'recharts'


class StatOverview extends Component {
    constructor(props) {
        super(props)

        this.state = {
            selected: new Set(),
        }

        this.toggle = this.toggle.bind(this)
        this.getData = this.getData.bind(this)
        this.getPart = this.getPart.bind(this)
    }
    toggle(event) {
        var select_value = event.target.value
        var select = this.state.selected
        this.state.selected.has(select_value) ? select.delete(select_value): select.add(select_value)
        this.setState({selected: select})
    }
    getData() {
        var team100 = this.props.parent.getTeam100()
        var team200 = this.props.parent.getTeam200()
        var parts = [...team100, ...team200]
        for (var i=0; i<parts.length; i++) {
            parts[i] = {...parts[i], ...parts[i].stats}
        }
        return parts
    }
    getPart(name) {
        for (var part of this.props.parent.props.match.participants) {
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
        var match = this.props.parent.props.match
        var team100 = this.props.parent.getTeam100()
        var team200 = this.props.parent.getTeam200()
        var parts = [...team100, ...team200]
        return (
            <div>
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

                    <div style={{marginBottom: 80}}></div>

                </div>


                <div style={{position: 'absolute', top: 25, bottom: 0, left: 455, width: 50}}>
                    
                    {parts.map(part => {
                        return (
                            <div key={`${match._id}-${part._id}`} style={{height:30, width:30, paddingBottom: 33}}>
                                <img style={{height:20}} src={part.champion.image_url} alt=""/>
                            </div>
                        )
                    })}

                </div>


                <div style={{display: 'inline-block', marginLeft: -25}}>
                    <BarChart layout='vertical' width={260} height={370} data={this.getData()}>
                        <YAxis
                            type='category'
                            dataKey="summoner_name"
                            interval={0}
                            tickFormatter={() => ''}
                            />
                        <XAxis type='number'/>
                        {[...this.state.selected].map((key) => {
                            return (
                                <Bar key={`${key}-bar`} dataKey={key} fill="#8884d8" />
                            )
                        })}
                    </BarChart>
                </div>
            </div>
        )
    }
}

export default StatOverview