import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import Modal from 'react-modal'
import numeral from 'numeral'
import { formatDatetimeTime } from '../../constants/general'
import { MODALSTYLE } from '../summoner/Summoner'

import api from '../../api/api'

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
        this.getGameTime = this.getGameTime.bind(this)
        this.getQueue = this.getQueue.bind(this)
    }
    componentDidMount() {
        this.setState({ is_retrieving: true })
        this.getSpectate(() => {
            this.setState({ is_retrieving: false })
        })

        this.gametime_interval = window.setInterval(() => {
            if (this.matchtime !== undefined) {
                this.matchtime.innerHTML = this.getGameTime()
            }
        }, 1000)
    }
    componentWillUnmount() {
        window.clearInterval(this.gametime_interval)
    }
    getSpectate(callback) {
        var data = {
            region: this.props.region,
            summoner_id: this.props.summoner_id,
        }
        api.match
            .getSpectate(data)
            .then(response => {
                this.setState({ spectate_data: response.data.data }, () => {
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
    getQueue() {
        try {
            return this.props.queue_convert[this.state.spectate_data.gameQueueConfigId].description
        } catch (error) {
            return `Queue ${this.state.spectate_data.gameQueueConfigId}`
        }
    }
    participantLine(part) {
        var pos = this.getTopSoloPosition(part.positions)
        let champion = part.champion || {}
        return (
            <div key={part.summonerId}>
                <hr />
                <div>
                    <div style={{ display: 'inline-block' }}>
                        <img
                            style={{ height: 50, borderRadius: 4 }}
                            src={champion.image_url}
                            alt=""
                        />
                        <div>
                            <small style={{}}>
                                {this.props.summoner_id === part.summonerId && (
                                    <span style={{ verticalAlign: 'top' }}>
                                        {part.summonerName}
                                    </span>
                                )}
                                {this.props.summoner_id !== part.summonerId && (
                                    <Link
                                        target="_blank"
                                        style={{ verticalAlign: 'top' }}
                                        className={`${this.props.theme}`}
                                        to={`/${this.props.region}/${part.summonerName}/`}
                                    >
                                        {part.summonerName}
                                    </Link>
                                )}
                            </small>{' '}
                        </div>
                    </div>
                    {pos !== null && (
                        <div
                            style={{ float: 'right', display: 'inline-block', textAlign: 'right' }}
                        >
                            <small className={`${this.props.theme} pill`}>
                                {pos.tier} {pos.rank}
                            </small>
                            <br />
                            <small>
                                {pos.wins}W / {pos.losses}L
                            </small>
                            <br />
                            <small>{`${numeral((pos.wins / (pos.wins + pos.losses)) * 100).format(
                                '0.0',
                            )}%`}</small>
                        </div>
                    )}
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
    getGameTime() {
        if (this.state.spectate_data !== null) {
            var now = new Date().getTime()
            var ms = now - this.state.spectate_data.gameStartTime
            var total_seconds = Math.round(ms / 1000)
            var minutes = Math.floor(total_seconds / 60)
            var seconds = total_seconds % 60
            return `${numeral(minutes).format('0')}:${numeral(seconds).format('00')}`
        } else {
            return ''
        }
    }
    render() {
        let width = 700
        if (this.state.is_retrieving) {
            return <div style={{ width: width }}>LOADING...</div>
        } else {
            if (this.state.spectate_data !== null) {
                return (
                    <div style={{ width: width, margin: '0px auto' }}>
                        <div
                            style={{
                                display: 'inline-block',
                                position: 'fixed',
                                top: 60,
                                right: 60,
                            }}
                        >
                            <button onClick={this.props.closeModal} className={`btn-floating btn-large red`}>
                                <i className="material-icons">close</i>
                            </button>
                        </div>
                        <h5 style={{ margin: 0, display: 'inline-block' }}>{this.getQueue()}</h5>{' '}
                        <span style={{ float: 'right', paddingRight: 40 }}>
                            Match started at{' '}
                            {formatDatetimeTime(this.state.spectate_data.gameStartTime)} |{' '}
                            <span
                                style={{ width: 50, display: 'inline-block' }}
                                ref={elt => {
                                    this.matchtime = elt
                                }}
                            ></span>
                        </span>
                        <div style={{ height: 10 }}></div>
                        <div>
                            <div style={{ width: 350, display: 'inline-block' }}>
                                {this.getTeam(100).map(part => {
                                    return this.participantLine(part)
                                })}
                            </div>
                            <div style={{ width: 350, display: 'inline-block', paddingLeft: 15 }}>
                                {this.getTeam(200).map(part => {
                                    return this.participantLine(part)
                                })}
                            </div>
                        </div>
                    </div>
                )
            } else {
                // not in a game
                return (
                    <div style={{ width: width }}>
                        <h5 style={{ margin: 0 }}>This summoner is not currently in a game.</h5>
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
        MODALSTYLE.content.display = 'flex'
        return (
            <div>
                {/* <Modal */}
                {/*     classNames={{modal: `${theme} custom-modal`}} */}
                {/*     styles={{overlay: {overflowX: 'scroll'}}} */}
                {/*     open={this.props.pageStore.state.is_spectate_modal_open} */}
                {/*     onClose={() => this.props.pageStore.setState({is_spectate_modal_open: false})} */}
                {/*     center> */}
                <Modal
                    style={MODALSTYLE}
                    isOpen={this.props.pageStore.state.is_spectate_modal_open}
                    onRequestClose={() =>
                        this.props.pageStore.setState({ is_spectate_modal_open: false })
                    }
                >
                    <Spectate
                        closeModal={() => this.props.pageStore.setState({ is_spectate_modal_open: false })}
                        queue_convert={this.props.queue_convert}
                        theme={theme}
                        region={this.props.pageStore.props.region}
                        summoner_id={this.props.summoner_id}
                    />
                </Modal>
                <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => this.props.pageStore.setState({ is_spectate_modal_open: true })}
                >
                    {this.props.children}
                </span>
            </div>
        )
    }
}

export default { Spectate, SpectateModal }
