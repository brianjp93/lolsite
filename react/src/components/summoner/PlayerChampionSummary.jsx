import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import numeral from 'numeral'
import ReactTooltip from 'react-tooltip'
import Orbit from '../general/spinners/orbit'
import StatBar from '../general/StatBar'

import api from '../../api/api'

class PlayerChampionSummary extends Component {
    constructor(props) {
        super(props)

        this.state = {
            time_division: 'days',
            time_value: 30,
            version: {},
            start: 0,
            end: 5,

            queue_selection: '',

            champions: {},

            stats: [],

            queues: {
                norms: [2, 430, 400],
                solo: [420],
                flex: [440],
                '3v3': [470],
                aram: [100, 450],
                clash: [700],
            },

            fields: [
                'kda',
                'kills_sum',
                'deaths_sum',
                'assists_sum',
                'dpm',
                'gpm',
                'cspm',
                'vspm',
                'dtpd',
                'minutes',
                'wins',
                'losses',
            ],

            is_loading: false,
            is_load_all: false,
        }

        this.getParams = this.getParams.bind(this)
        this.getChampionStats = this.getChampionStats.bind(this)
        this.getChampionData = this.getChampionData.bind(this)
        this.isTimeFrameSelected = this.isTimeFrameSelected.bind(this)
        this.getCurrentSeason = this.getCurrentSeason.bind(this)
        this.updateTimeFrame = this.updateTimeFrame.bind(this)
        this.renderChampionData = this.renderChampionData.bind(this)
        this.selectQueue = this.selectQueue.bind(this)
        this.isQueueSelected = this.isQueueSelected.bind(this)
    }
    componentDidMount() {
        this.getCurrentSeason()
        this.getChampionStats()
    }
    componentDidUpdate(prevProps) {
        if (this.props.summoner.id !== prevProps.summoner.id) {
            this.getChampionStats()
        }
    }
    getCurrentSeason() {
        api.data.getCurrentSeason().then((response) => {
            this.setState({ version: response.data.data })
        })
    }
    getChampionData() {
        let champion_keys = []
        for (let stat of this.state.stats) {
            if (this.state.champions[stat.champion_id] === undefined) {
                champion_keys.push(stat.champion_id)
            }
        }
        if (champion_keys.length > 0) {
            let data = { champions: champion_keys }
            api.data.getChampions(data).then((response) => {
                let new_champ = Object.assign({}, this.state.champions)
                for (var champ of response.data.data) {
                    if (new_champ[champ.key] === undefined) {
                        new_champ[champ.key] = champ
                    }
                }
                this.setState({ champions: new_champ })
            })
        }
    }
    getParams() {
        let data = {
            summoner_id: this.props.summoner.id,
            start: this.state.start,
            end: this.state.end,
            order_by: '-count',
            fields: this.state.fields,
        }
        if (this.state.is_load_all) {
            data.end = 500
        }
        if (this.state.time_division === 'days') {
            let now = moment()
            let start = now.subtract(this.state.time_value, 'days')
            data.start_datetime = start.toISOString()
        } else if (this.state.time_division === 'season') {
            data.season = this.state.time_value
        }

        if (this.state.queue_selection !== '') {
            data.queue_in = this.state.queues[this.state.queue_selection]
        }

        return data
    }
    getChampionStats() {
        let data = this.getParams()

        if (data.summoner_id !== undefined) {
            this.setState({ is_loading: true })
            api.player
                .getChampionsOverview(data)
                .then((response) => {
                    this.setState({ stats: response.data.data }, this.getChampionData)
                })
                .catch((error) => {})
                .then(() => {
                    this.setState({ is_loading: false })
                })
        }
    }
    isTimeFrameSelected(time_division, time_value) {
        if (this.state.time_division === time_division && this.state.time_value === time_value) {
            return true
        }
        return false
    }
    updateTimeFrame(time_division, time_value) {
        if (this.state.time_division === time_division && this.state.time_value === time_value) {
            // do nothing
        } else {
            this.setState({ time_division, time_value }, this.getChampionStats)
        }
    }
    truncateName(name) {
        let out = name
        if (name === null) {
            return ''
        }
        if (name.length > 8) {
            out = `${name.slice(0, 8)}...`
        }
        return out
    }
    selectQueue(name) {
        if (this.state.queue_selection === name) {
            // do nothing
        } else {
            this.setState({ queue_selection: name }, this.getChampionStats)
        }
    }
    isQueueSelected(name) {
        if (this.state.queue_selection === name) {
            return true
        }
        return false
    }
    renderChampionData(data) {
        const {
            count,
            kills_sum,
            deaths_sum,
            assists_sum,
            wins,
            losses,
            champion_id,
            champion,
            vspm,
            cspm,
            kda,
            dpm,
            dtpd,
        } = data
        let theme = this.props.store.state.theme

        let average_kills = kills_sum / count
        let average_deaths = deaths_sum / count
        let average_assists = assists_sum / count
        // let win_percentage = (wins / (wins + losses)) * 100
        let champ = this.state.champions[champion_id]
        return (
            <div
                style={{
                    display: 'inline-block',
                    width: '100%',
                }}
            >
                {champ !== undefined && (
                    <ReactTooltip id={`${champion_id}-image-tooltip`} effect="solid">
                        <span>
                            {champ.name}: {champ.title}
                        </span>
                    </ReactTooltip>
                )}
                {champ === undefined && (
                    <ReactTooltip id={`${champion_id}-image-tooltip`} effect="solid">
                        <span>{champion}</span>
                    </ReactTooltip>
                )}
                <div data-tip data-for={`${champion_id}-image-tooltip`}>
                    {champ !== undefined && (
                        <img
                            style={{ maxHeight: 30, display: 'inline-block', borderRadius: '50%' }}
                            src={champ.thumbs?.file_30}
                            alt=""
                        />
                    )}
                    <div
                        style={{
                            marginLeft: 3,
                            display: 'inline-block',
                            fontSize: 'small',
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{this.truncateName(champion)}</div>
                        <div>
                            <span style={{ fontWeight: 'bold' }}>{count}</span> games
                        </div>
                    </div>
                </div>

                <div>
                    <StatBar
                        theme={theme}
                        val1={wins}
                        val2={losses}
                        label1={<span>{wins} Wins</span>}
                        label2={<span>{losses} Losses</span>}
                    />
                </div>

                <div
                    style={{
                        marginTop: -5,
                        marginBottom: 5,
                        borderBottomStyle: 'solid',
                        borderBottomWidth: 1,
                        borderBottomColor: 'grey',
                        paddingBottom: 5,
                    }}
                ></div>

                <div>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>{numeral(kda).format('0.00')}</span>{' '}
                        <span>KDA</span>
                    </div>
                    <div style={{ fontSize: 'small', paddingLeft: 15 }}>
                        <span style={{ fontWeight: 'bold' }}>
                            {numeral(average_kills).format('0.0')}
                        </span>
                        /
                        <span style={{ fontWeight: 'bold' }}>
                            {numeral(average_deaths).format('0.0')}
                        </span>
                        /
                        <span style={{ fontWeight: 'bold' }}>
                            {numeral(average_assists).format('0.0')}
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: 'small', marginTop: 5 }}>
                    <ReactTooltip id={`${champion_id}-dpm-tooltip`} effect="solid">
                        <span>Damage per Minute</span>
                    </ReactTooltip>
                    <div data-tip data-for={`${champion_id}-dpm-tooltip`}>
                        <span>DPM</span> :{' '}
                        <span style={{ fontWeight: 'bold' }}>{numeral(dpm).format('0,0')}</span>
                    </div>
                </div>

                <div style={{ fontSize: 'small' }}>
                    <ReactTooltip id={`${champion_id}-dtpd-tooltip`} effect="solid">
                        <span>Damage Taken per Death</span>
                    </ReactTooltip>
                    <div data-tip data-for={`${champion_id}-dtpd-tooltip`}>
                        <span>DT/D</span> :{' '}
                        <span style={{ fontWeight: 'bold' }}>{numeral(dtpd).format('0,0')}</span>
                    </div>
                </div>

                <div style={{ fontSize: 'small' }}>
                    <ReactTooltip id={`${champion_id}-cs-tooltip`} effect="solid">
                        <span>CS per Minute</span>
                    </ReactTooltip>
                    <div data-tip data-for={`${champion_id}-cs-tooltip`}>
                        <span>CS/M</span> :{' '}
                        <span style={{ fontWeight: 'bold' }}>{numeral(cspm).format('0.00')}</span>
                    </div>
                </div>

                <div style={{ fontSize: 'small' }}>
                    <ReactTooltip id={`${champion_id}-vs-tooltip`} effect="solid">
                        <span>Vision Score per Minute</span>
                    </ReactTooltip>
                    <div data-tip data-for={`${champion_id}-vs-tooltip`}>
                        <span>VS/M</span> :{' '}
                        <span style={{ fontWeight: 'bold' }}>{numeral(vspm).format('0.00')}</span>
                    </div>
                </div>
            </div>
        )
    }
    render() {
        // const store = this.props.store
        // const parent = this.props.parent
        // const summoner = this.props.summoner
        // const theme = store.state.theme
        const major = this.state.version.major

        const unselected_style = {
            display: 'inline-block',
            fontSize: 'small',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: 'grey',
            padding: 3,
            borderRadius: 3,
            cursor: 'pointer',
            width: 90,
            textAlign: 'center',
            margin: '0 4px',
        }
        let selected_style = {
            ...unselected_style,
        }
        selected_style.fontWeight = 'bold'
        selected_style.borderWidth = 2
        selected_style.borderColor = '#9aa8ce'
        selected_style.color = '#9aa8ce'

        let queue_selected_style = {
            ...selected_style,
        }
        queue_selected_style.borderColor = '#9accd2'
        queue_selected_style.color = '#9accd2'
        return (
            <div>
                <div style={{ marginBottom: 5 }} className="row">
                    <div style={{ fontSize: 'small' }} className="col s12 unselectable">
                        <div style={{ display: 'inline-block' }}>
                            <div
                                onClick={() => this.updateTimeFrame('days', 30)}
                                style={
                                    this.isTimeFrameSelected('days', 30)
                                        ? selected_style
                                        : unselected_style
                                }
                            >
                                30 days
                            </div>
                            <div
                                onClick={() => this.updateTimeFrame('days', 60)}
                                style={
                                    this.isTimeFrameSelected('days', 60)
                                        ? selected_style
                                        : unselected_style
                                }
                            >
                                60 days
                            </div>
                        </div>
                        <div style={{ display: 'inline-block', float: 'right' }}>
                            {major !== undefined &&
                                [major, major - 1, major - 2].map((ver, key) => {
                                    return (
                                        <div
                                            key={`${ver}-${key}`}
                                            onClick={() => this.updateTimeFrame('season', ver)}
                                            style={
                                                this.isTimeFrameSelected('season', ver)
                                                    ? selected_style
                                                    : unselected_style
                                            }
                                        >
                                            Season {ver}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 5 }} className="row">
                    <div style={{ fontSize: 'small' }} className="col s12 unselectable">
                        <div style={{ display: 'inline-block' }}>
                            <div
                                onClick={() => this.selectQueue('')}
                                style={
                                    this.isQueueSelected('')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                All
                            </div>
                        </div>

                        <div style={{ display: 'inline-block', float: 'right' }}>
                            <div
                                onClick={() => this.selectQueue('solo')}
                                style={
                                    this.isQueueSelected('solo')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                Solo/Duo
                            </div>
                            <div
                                onClick={() => this.selectQueue('flex')}
                                style={
                                    this.isQueueSelected('flex')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                Flex
                            </div>
                            <div
                                onClick={() => this.selectQueue('norms')}
                                style={
                                    this.isQueueSelected('norms')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                Norms
                            </div>
                            <div
                                onClick={() => this.selectQueue('clash')}
                                style={
                                    this.isQueueSelected('clash')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                Clash
                            </div>
                            <div
                                onClick={() => this.selectQueue('aram')}
                                style={
                                    this.isQueueSelected('aram')
                                        ? queue_selected_style
                                        : unselected_style
                                }
                            >
                                ARAM
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 0 }} className="row">
                    <div
                        className="col s12 quiet-scroll"
                        style={{ maxHeight: 300, overflowY: 'scroll' }}
                    >
                        {this.state.stats.map((data, key) => {
                            return (
                                <Fragment key={`${data.champion_id}-${key}`}>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            width: 140,
                                            borderStyle: 'solid',
                                            borderWidth: 1,
                                            borderColor: 'grey',
                                            borderRadius: 4,
                                            padding: 8,
                                            margin: '0 2px',
                                        }}
                                        key={`${data.champion_id}-${key}`}
                                    >
                                        {this.state.is_loading && (
                                            <div style={{ textAlign: 'center' }}>
                                                <Orbit size={80} style={{ margin: 'auto' }} />
                                            </div>
                                        )}
                                        {!this.state.is_loading && this.renderChampionData(data)}
                                    </div>
                                    {(key + 1) % 5 === 0 && <br />}
                                </Fragment>
                            )
                        })}
                        {this.state.stats.length === 0 && !this.state.is_loading && (
                            <div
                                style={{
                                    display: 'inline-block',
                                    width: '100%',
                                    borderStyle: 'solid',
                                    borderWidth: 1,
                                    borderColor: 'grey',
                                    borderRadius: 4,
                                    padding: 8,
                                    margin: '0 2px',
                                }}
                            >
                                <span>No Data</span>
                            </div>
                        )}
                        {!(this.state.stats.length === 0 && !this.state.is_loading) &&
                            !this.state.is_load_all && (
                                <div style={{ paddingTop: 8 }}>
                                    <button
                                        onClick={() =>
                                            this.setState(
                                                { is_load_all: true },
                                                this.getChampionStats,
                                            )
                                        }
                                        className={`${this.props.theme} btn-small`}
                                        style={{ width: '100%' }}
                                    >
                                        Load All
                                    </button>
                                </div>
                            )}
                    </div>
                </div>
            </div>
        )
    }
}
PlayerChampionSummary.propTypes = {
    store: PropTypes.object.isRequired,
    parent: PropTypes.object.isRequired,
    summoner: PropTypes.object.isRequired,
    theme: PropTypes.string,
}

export default PlayerChampionSummary
