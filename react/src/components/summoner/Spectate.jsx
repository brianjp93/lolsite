import React, { Component } from 'react'
import Modal from 'react-responsive-modal'
import moment from 'moment'

import api from '../../api/api'


function formatDatetime(epoch) {
    return moment(epoch).format('h:mm a')
}


class Spectate extends Component {
    constructor(props) {
        super(props)
        this.state = {
            spectate_data: null,
            is_retrieving: false,
        }

        this.getSpectate = this.getSpectate.bind(this)
        this.getTeam = this.getTeam.bind(this)
        this.getTopSoloPosition = this.getTopSoloPosition.bind(this)
    }
    componentDidMount() {
        this.setState({is_retrieving: true})
        this.getSpectate(() => {
            this.setState({is_retrieving: false})
        })
    }
    getSpectate(callback) {
        var data = {
            region: this.props.region,
            summoner_id: this.props.summoner_id,
        }
        api.match.getSpectate(data)
            .then(response => {
                this.setState({spectate_data: response.data.data}, () => {
                    if (callback !== undefined) {
                        callback()
                    }
                })
            })
            .catch(error => {
                if (callback !== undefined) {
                    callback()
                }
            })
    }
    getTeam(team_id) {
        var team = []
        for (var part of this.state.spectate_data.participants) {
            if (part.teamId === team_id) {
                team.push(part)
            }
        }
        return team
    }
    participantLine(part) {
        var pos = this.getTopSoloPosition(part.positions)
        return (
            <div key={part.summonerId}>

                <div>
                    <img style={{height:50, borderRadius:4}} src={part.champion.image_url} alt=""/>
                    <small style={{paddingLeft:10, verticalAlign:'top'}}>{part.summonerName}</small>{' '}
                        {pos !== null &&
                            <div style={{float: 'right', display: 'inline-block', textAlign:'right'}}>
                                <small className={`${this.props.theme} pill`}>
                                    {pos.tier} {pos.rank}
                                </small>
                                <br/>
                                <small>{pos.wins} wins / {pos.losses} losses</small>
                            </div>
                        }
                </div>
            </div>
        )
    }
    getTopSoloPosition(positions) {
        var top = null
        if (positions !== null) {
            for (var pos of positions) {
                if (pos.queue_type === 'RANKED_SOLO_5x5') {
                    return pos
                }
            }
        }
        return top
    }
    render() {
        let width = 700
        if (this.state.is_retrieving) {
            return (
                <div style={{width: width}}>
                    LOADING...
                </div>
            )
        }
        else {
            if (this.state.spectate_data !== null) {
                return (
                    <div style={{width: width}}>
                        <h5 style={{margin:0, display: 'inline-block'}}>Live Match</h5>{' '}

                        <span style={{float: 'right', paddingRight:40}}>Match started at {formatDatetime(this.state.spectate_data.gameStartTime)}</span>

                        <div style={{height:10}}></div>

                        <div>
                            <div style={{width:320, display:'inline-block'}}>
                                {this.getTeam(100).map(part =>  {
                                    return this.participantLine(part)
                                })}
                            </div>
                            <div style={{width:320, display:'inline-block', paddingLeft:15}}>
                                {this.getTeam(200).map(part =>  {
                                    return this.participantLine(part)
                                })}
                            </div>
                        </div>
                    </div>
                )
            }
            else {
                // not in a game
                return (
                    <div style={{width: width}}>
                        <h5 style={{margin:0}}>
                            This summoner is not currently in a game.
                        </h5>
                    </div>
                )
            }
        }
    }
}

class SpectateModal extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    render() {
        let theme = this.props.theme
        return (
            <div>
                <Modal
                    classNames={{modal: `${theme} custom-modal`}}
                    open={this.props.pageStore.state.is_spectate_modal_open}
                    onClose={() => this.props.pageStore.setState({is_spectate_modal_open: false})}
                    center>
                    <Spectate theme={theme} region={this.props.pageStore.props.region} summoner_id={this.props.summoner_id} />
                </Modal>
                <span
                    style={{cursor:'pointer'}}
                    onClick={() => this.props.pageStore.setState({is_spectate_modal_open: true})}>
                    {this.props.children}
                </span>
            </div>
        )
    }
}


export default {Spectate, SpectateModal}