import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-responsive-modal'
import ReactTooltip from 'react-tooltip'
import api from '../../api/api'
import toastr from 'toastr'

import queuefilter from '../../constants/queuefilter'


class MatchFilter extends Component {
    constructor(props) {
        super(props)

        this.champ_card = React.createRef()

        this.state = {
            queue_filter: '',
            summoner_filter: '',
            champions: [],
            champion: '',
            is_champion_card_open: false,

            is_applying: false,

            is_modal_open: false,
        }

        this.isFiltersApplied = this.isFiltersApplied.bind(this)
        this.getFilterParams = this.getFilterParams.bind(this)
        this.updateParent = this.updateParent.bind(this)
        this.apply = this.apply.bind(this)
        this.openModal = this.openModal.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.setDefaults = this.setDefaults.bind(this)
        this.getChampions = this.getChampions.bind(this)
        this.getChampionMatches = this.getChampionMatches.bind(this)
        this.handleChampionKeyDown = this.handleChampionKeyDown.bind(this)
        this.clearFilters = this.clearFilters.bind(this)
        this.handleOutsideClick = this.handleOutsideClick.bind(this)
    }
    componentDidUpdate(prevProps, prevState) {
        let prev_summoner = prevProps.summoner
        let now_summoner = this.props.summoner
        if (prev_summoner !== undefined && now_summoner !== undefined) {
            if (prev_summoner.id !== now_summoner.id) {
                // this.setState(this.props.match_filters)
            }
        }
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleOutsideClick)
    }
    isFiltersApplied() {
        let filters = this.getFilterParams()
        for (let filter in filters) {
            if (['', null, undefined].indexOf(filters[filter]) === -1) {
                return true
            }
        }
        return false
    }
    getChampions() {
        let data = {
            fields: ['key', 'name'],
            order_by: 'name',
        }
        api.data.getChampions(data)
            .then(response => {
                this.setState({champions: response.data.data})
            })
            .catch(error => {

            })
            .then(() => {

            })
    }
    setDefaults(callback) {
        let data = {
            queue_filter: '',
            summoner_filter: '',
            champion: '',
            // is_applying: false,
        }
        this.setState(data, () => {
            if (callback !== undefined) {
                callback()
            }
        })
    }
    handleOutsideClick(event) {
        if (this.champ_card.current && !this.champ_card.current.contains(event.target)) {
            if (this.state.is_champion_card_open) {
                this.setState({is_champion_card_open: false})
            }
        }
    }
    componentDidMount() {
        window.$('select').formSelect()
        // this.updateParent()
        this.getChampions()
        document.addEventListener("mousedown", this.handleOutsideClick);
    }
    getFilterParams() {
        let champ_key = null
        if (this.state.champion.length > 0) {
            for (var champ of this.state.champions) {
                if (champ.name.toLowerCase() === this.state.champion.toLowerCase()) {
                    champ_key = champ.key
                }
            }
        }
        let data = {
            queue_filter: this.state.queue_filter,
            summoner_filter: this.state.summoner_filter,
            champion: champ_key,
        }
        if (champ_key !== null) {
            data.champion = champ_key
        }
        return data
    }
    updateParent(callback) {
        let parent_filters = this.props.parent.state.match_filters
        let this_filters = this.getFilterParams()
        if (JSON.stringify(parent_filters) !== JSON.stringify(this_filters)) {
            this.props.parent.setState(
                {match_filters: this_filters},
                () => {
                    if (callback !== undefined) {
                        callback()
                    }
                }
            )
        }
        else {
            if (callback !== undefined) {
                callback()
            }
        }
    }
    apply() {
        if (!this.state.is_applying) {
            this.setState({is_applying: true})
            this.updateParent(() => {
                this.props.parent.reloadMatches(() => {
                    this.setState({is_applying: false})
                })
            })
            this.setState({is_modal_open: false})
        }
        else {
            toastr.error('Already applying some filters')
        }
    }
    openModal() {
        this.setState({is_modal_open: true}, () => {
            this.summoner_filter_input.focus()
        })
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.apply()
            event.preventDefault()
            event.stopPropagation()
        }
    }
    getChampionMatches() {
        let out = []
        if (this.state.champion.length > 0) {
            let reg = this.state.champion.split('').map(l => `${l}(.*)+`)
            reg[reg.length - 1] = this.state.champion[this.state.champion.length - 1]
            reg = reg.join('')
            reg = RegExp(reg, 'i')
            out = this.state.champions.filter(champ => {return champ.name.match(reg) !== null})
        }
        else {
            out = this.state.champions
        }
        return out
    }
    handleChampionKeyDown(event) {
        if (event.key === 'Enter') {
            if (this.state.champion.length === 0) {
                this.setState({is_champion_card_open: false})
                this.apply()
            }
            else {
                let matches = this.getChampionMatches()
                if (matches.length > 0) {
                    this.setState({champion: matches[0].name, is_champion_card_open: false}, this.apply)
                }
                else {
                    this.setState({is_champion_card_open: false})
                    toastr.error('No matches for this string.')
                }
            }
        }
    }
    clearFilters() {
        this.setDefaults(() => {
            this.apply()
            try {
                this.queue_select.parentElement.getElementsByTagName('input')[0].click()
                this.queue_select.parentElement.getElementsByTagName('input')[0].click()
            }
            catch(error) {}
        })
    }
    render() {
        const store = this.props.store
        // const parent = this.props.parent
        const theme = store.state.theme

        let clear_filters_params = {}
        if (!this.isFiltersApplied()) {
            clear_filters_params.disabled = true
        }
        else if (this.state.is_applying) {
            clear_filters_params.disabled = true
        }
        return (
            <div>
                <div>
                    <div
                        style={{marginBottom: 0}}
                        className="row">
                        <div className="col s6">
                            <div className={`input-field ${theme}`}>
                                <select
                                    ref={(elt) => {this.queue_select = elt}}
                                    onChange={(elt) => {
                                        this.setState({queue_filter: elt.target.value}, this.apply)}
                                    }
                                    value={this.state.queue_filter}>
                                    {[{name: 'any', id: ''}].concat(queuefilter).map((queue, key) => {
                                        return (
                                            <option key={`${queue.id}-${key}`} value={queue.id}>{queue.name}</option>
                                        )
                                    })}
                                </select>
                                <label>Queue</label>
                            </div>
                        </div>
                        <div
                            style={{position: 'relative'}}
                            className="col s6">
                            <div className={`input-field ${theme}`}>
                                <input
                                    ref={(elt) => {this.champion_select = elt}}
                                    autoComplete='off'
                                    id='champ-input-selection'
                                    className={`${theme}`}
                                    type="text"
                                    value={this.state.champion}
                                    onChange={(event) => this.setState({champion: event.target.value})}
                                    onClick={() => this.setState({is_champion_card_open: true})}
                                    onFocus={() => this.setState({is_champion_card_open: true})}
                                    onKeyDown={this.handleChampionKeyDown} />
                                <label htmlFor="champ-input-selection">Champion</label>
                            </div>
                            {this.state.is_champion_card_open &&
                                <div
                                    ref={this.champ_card}
                                    style={{
                                        position: 'absolute',
                                        width: 400,
                                        top: 60,
                                        zIndex: 11,
                                    }}
                                    className={`card-panel ${theme}`}>
                                    <div className="row">
                                        <button
                                            onClick={() => this.setState({is_champion_card_open: false})}
                                            style={{width: '100%'}} className={`${theme} btn-small`}>
                                            close
                                        </button>
                                    </div>
                                    <div
                                        style={{height: 300, overflow: 'scroll', marginBottom: 0}}
                                        className="row">
                                    {this.getChampionMatches().map((champ, key) => {
                                        return (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 'small',
                                                    borderStyle: 'solid',
                                                    borderWidth: 1,
                                                    borderColor: 'grey',
                                                    borderRadius: 4,
                                                    padding: 3,
                                                    cursor: 'pointer',
                                                }}
                                                className='col s3'
                                                key={`${key}-${champ.name}`}
                                                onClick={() => this.setState(
                                                    {champion: champ.name, is_champion_card_open: false},
                                                    () => {
                                                        this.apply()
                                                        this.champion_select.focus()
                                                        this.champion_select.blur()
                                                        this.setState({is_champion_card_open: false})
                                                    }
                                                )} >
                                                {champ.name}
                                            </div>
                                        )
                                    })}
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                    <div className="row">
                        <div className="col s12">
                            <button
                                onClick={this.openModal}
                                className={`${theme} btn-small`}>
                                More Filters
                            </button>{' '}
                            <button
                                {...clear_filters_params}
                                onClick={this.clearFilters}
                                className={`${theme} btn-small`}>
                                Clear Filters
                            </button>{' '}
                            {this.isFiltersApplied() &&
                                <span
                                    className={`${theme} success-bordered`}
                                    style={{fontSize: 'small', padding: 7}}>
                                    Filters are applied
                                </span>
                            }
                        </div>
                    </div>
                </div>

                <Modal
                    classNames={{modal: `${theme} custom-modal`}}
                    styles={{
                        overlay: {
                            overflowX: 'scroll',
                        },
                        modal: {
                            width: '100%',
                        }
                    }}
                    open={this.state.is_modal_open}
                    onClose={() => this.setState({is_modal_open: false})}
                    center>
                    <div>
                        <div className="row">
                            <div className="col s12">
                                <ReactTooltip
                                    id={`summoner-filter-tooltip`}
                                    effect='solid'>
                                    <span>Many summoner names may be entered, separated by a comma.</span>
                                </ReactTooltip>
                                <div
                                    data-tip
                                    data-for='summoner-filter-tooltip'
                                    id='summoner-filter-tooltip'
                                    className="input-field">
                                    <input
                                        ref={(elt) => {this.summoner_filter_input = elt}}
                                        id='summoner_filter_field'
                                        value={this.state.summoner_filter}
                                        onChange={(event) => this.setState({summoner_filter: event.target.value})}
                                        onKeyDown={this.handleKeyDown}
                                        type="text"
                                        className={`${theme}`} />
                                    <label htmlFor="summoner_filter_field">Summoner Names</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={this.apply}
                                className={`${theme} btn-small`} >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        )
    }
}
MatchFilter.propTypes = {
    store: PropTypes.object.isRequired,
    parent: PropTypes.object.isRequired,
}

export default MatchFilter