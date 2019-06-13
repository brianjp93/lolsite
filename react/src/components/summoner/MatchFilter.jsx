import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-responsive-modal'
import ReactTooltip from 'react-tooltip'

import queuefilter from '../../constants/queuefilter'


class MatchFilter extends Component {
    constructor(props) {
        super(props)

        this.state = {
            queue_filter: '',
            summoner_filter: '',

            is_modal_open: false,
        }

        this.getFilterParams = this.getFilterParams.bind(this)
        this.updateParent = this.updateParent.bind(this)
        this.apply = this.apply.bind(this)
        this.openModal = this.openModal.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.setDefaults = this.setDefaults.bind(this)
    }
    componentDidUpdate(prevProps, prevState) {
        let prev_summoner = prevProps.summoner
        let now_summoner = this.props.summoner
        if (prev_summoner !== undefined && now_summoner !== undefined) {
            if (prev_summoner.id !== now_summoner.id) {
                this.setDefaults()
            }
        }
    }
    setDefaults() {
        let data = {
            queue_filter: '',
            summoner_filter: '',
        }
        this.setState(data)
    }
    componentDidMount() {
        window.$('select').formSelect()
        this.updateParent()
    }
    getFilterParams() {
        let data = {
            queue_filter: this.state.queue_filter,
            summoner_filter: this.state.summoner_filter,
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
    apply(callback) {
        this.updateParent(this.props.parent.reloadMatches)
        this.setState({is_modal_open: false})
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
    render() {
        const store = this.props.store
        // const parent = this.props.parent
        const theme = store.state.theme
        return (
            <div>
                <div>
                    <div className={`input-field ${theme}`}>
                        <select
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

                    <div className="row">
                        <div className="col s12">
                            <button
                                onClick={this.openModal}
                                className={`${theme} btn-small`}>
                                More Filters
                            </button>
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