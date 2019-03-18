import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Popover from 'react-tiny-popover'

import RUNES from '../../constants/runes'


class RunePage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            selected_part: null,
        }

        this.getVersion = this.getVersion.bind(this)
        this.getRune = this.getRune.bind(this)
        this.participants = this.participants.bind(this)
        this.getPerks = this.getPerks.bind(this)
        this.setDefaultParticipant = this.setDefaultParticipant.bind(this)
        this.partSelection = this.partSelection.bind(this)
    }
    componentDidMount() {
        var version = this.getVersion()
        if (this.props.store.state.runes[version] === undefined) {
            this.props.store.getRunes(version)
        }
        this.setDefaultParticipant()
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.selected_part === null) {
            if (this.participants() !== null) {
                this.setDefaultParticipant()
            }
        }
    }
    setDefaultParticipant() {
        var mypart = this.props.parent.getMyPart()
        var my_id = mypart._id
        var participants = this.participants()
        if (participants) {
            for (var part of this.participants()) {
                if (part._id === my_id) {
                    this.setState({selected_part: part})
                    break
                }
            }
        }
    }
    participants() {
        return this.props.parent.state.participants
    }
    getVersion() {
        var parent = this.props.parent
        var match = parent.props.match
        var version = `${match.major}.${match.minor}.1`
        return version
    }
    getRune(rune_id) {
        var version = this.getVersion()
        return this.props.store.getRune(rune_id, version)
    }
    getPerks(part) {
        var perks = []
        if (part === undefined) {
            part = this.state.selected_part
        }
        if (part === null) {
            return []
        }
        var perk
        for (var i=0; i<=5; i++) {
            perk = {
                id: part.stats[`perk_${i}`],
                var1: part.stats[`perk_${i}_var_1`],
                var2: part.stats[`perk_${i}_var_2`],
                var3: part.stats[`perk_${i}_var_3`],
            }
            perks.push(perk)
        }
        return perks
    }
    partSelection() {
        var match = this.props.parent.props.match
        let parts = [...this.props.parent.getTeam100(), ...this.props.parent.getTeam200()]
        return (
            parts.map(part => {
                var is_selected = false
                var select_style = {}
                if (this.state.selected_part !== null && part._id === this.state.selected_part._id) {
                    is_selected = true
                }
                if (is_selected) {
                    select_style = {
                        borderStyle: 'solid',
                        borderWidth: 2,
                        borderColor: 'white',
                    }
                }
                return (
                    <div key={`${match.id}-${part.id}-rune-champ-image`}>
                        <img
                            title={part.summoner_name}
                            onClick={() => this.setState({selected_part: part})}
                            style={{height: 30, ...select_style, cursor: 'pointer'}}
                            src={part.champion.image_url} alt=""/>
                    </div>
                )
            })
        )
    }
    render() {
        let match = this.props.parent.props.match
        // let mypart = this.props.parent.getMyPart()
        var rune_stat_height = (this.props.pageStore.state.match_card_height - 20) / 6
        // let parts = [...this.props.parent.getTeam100(), ...this.props.parent.getTeam200()]
        return (
            <div>
                <div style={{marginRight: 20, display: 'inline-block', marginLeft: 35}}>
                    {this.partSelection()}
                </div>
                <div style={{display: 'inline-block'}}>
                    {this.getPerks().map(perk => {
                        var rune = this.getRune(perk.id)
                        var rune_etc = RUNES.data[perk.id]
                        if (rune && rune_etc && rune_etc.perkFormat) {
                            return (
                                <div key={`${match.id}-${perk.id}`} style={{height: rune_stat_height}} >

                                    <RuneTooltip rune={rune} style={{display: 'inline-block'}} tooltip_style={this.props.store.state.tooltip_style}>
                                        <img
                                            style={{height: 40, paddingRight: 10}}
                                            src={rune.image_url}
                                            alt=""/>
                                    </RuneTooltip>

                                    <div style={{display: 'inline-block', verticalAlign: 'top'}}>
                                        {rune_etc.perkFormat.map((perk_format, j) => {
                                            var desc = rune_etc.perkDesc[j]
                                            return (
                                                <div style={{lineHeight: 1}} key={`${match._id}-${j}`}>
                                                    <div style={{display: 'inline-block', width: 200}}>
                                                        {desc}
                                                    </div>
                                                    <div style={{display: 'inline-block', fontWeight: 'bold'}}>
                                                        {perk_format.replace('{0}', perk[`var${j+1}`]).replace('{1}', perk[`var${j+2}`]).replace('{2}', perk[`var${j+2}`])}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        }
                        else {
                            if (rune) {
                                return(
                                    <div key={`${match.id}-${perk.id}`}>
                                        <div>
                                            {rune._id}
                                        </div>
                                        <div>var1 : {rune.var1}</div>
                                        <div>var2 : {rune.var2}</div>
                                        <div>var3 : {rune.var3}</div>
                                    </div>
                                )
                            }
                            else {
                                return (
                                    <div key={`${match.id}-${perk.id}`}>{perk.id}</div>
                                )
                            }
                        }
                    })}
                </div>
            </div>
        )
    }
}
RunePage.propTypes = {
    store: PropTypes.object,
    pageStore: PropTypes.object,
    parent: PropTypes.object,
}


class RuneTooltip extends Component {
    constructor(props)  {
        super(props)
        this.state = {
            is_open: false,
        }

        this.toggle = this.toggle.bind(this)
    }
    toggle() {
        this.setState({is_open: !this.state.is_open})
    }
    render() {
        let rune = this.props.rune
        return (
            <Popover
                transitionDuration={0.01}
                isOpen={this.state.is_open}
                position={'top'}
                containerStyle={{'z-index': '11'}}
                content={(
                    <div style={{...this.props.tooltip_style}}>
                        <h5 style={{textDecoration: 'underline', marginTop: -5}}>{rune.name}</h5>

                        <div dangerouslySetInnerHTML={{__html: rune.long_description}}></div>
                    </div>
                )} >
                <div
                    ref={(elt) => {this.target_elt = elt}}
                    style={this.props.style}
                    onClick={this.toggle}
                    onMouseOver={() => {
                        this.setState({is_open: true})
                    }}
                    onMouseOut={() => this.setState({is_open: false})}>
                    {this.props.children}
                </div>
            </Popover>
        )
    }
}
RuneTooltip.propTypes = {
    rune: PropTypes.object,
}

export default RunePage