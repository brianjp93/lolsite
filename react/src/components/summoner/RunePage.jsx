import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
    }
    componentDidMount() {
        var version = this.getVersion()
        if (this.props.store.state.runes[version] === undefined) {
            this.props.store.getRunes(version)
        }
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
    render() {
        let match = this.props.parent.props.match
        let mypart = this.props.parent.getMyPart()
        return (
            <div>
                <div style={{marginLeft: 30}}>
                    {this.getPerks().map(perk => {
                        var rune = this.getRune(perk.id)
                        var rune_etc = RUNES.data[perk.id]
                        if (rune && rune_etc && rune_etc.perkFormat) {
                            return (
                                <div key={`${match.id}-${perk.id}`}>
                                    <img
                                        style={{height: 40}}
                                        src={rune.image_url}
                                        alt=""/>

                                    <div style={{display: 'inline-block', verticalAlign: 'top'}}>
                                        {rune_etc.perkFormat.map((perk_format, j) => {
                                            var desc = rune_etc.perkDesc[j]
                                            return (
                                                <div key={`${match._id}-${j}`}>
                                                    {desc} : {perk_format.replace('{0}', perk[`var${j+1}`]).replace('{1}', perk[`var${j+2}`]).replace('{2}', perk[`var${j+2}`])}
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

export default RunePage