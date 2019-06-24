import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'


class SummonerSearchField extends Component {
    constructor(props) {
        super(props)
        this.state = {
            summoner_name: '',
            to_summoner_page: false,

            errors: {},
        }

        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyListener = this.handleKeyListener.bind(this)
        this.validate = this.validate.bind(this)
        this.search = this.search.bind(this)
    }
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyListener)
        try {
            if (this.props.start_with_focus) {
                this.input.focus()
                this.input.select()
            }
        }
        catch(error){}
    }
    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyListener)
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.search()
        }
    }
    handleKeyListener(event) {
        if (this.props.ignore_hotkeys.indexOf(event.key.toLowerCase()) >= 0) {
            return
        }
        else {
            if (this.props.store.state.ignore_tags.has(event.target.tagName.toLowerCase())) {
                if (['escape'].indexOf(event.key.toLowerCase()) >= 0) {
                    event.target.blur()
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
            else {
                if (['/', 's'].indexOf(event.key.toLowerCase()) >= 0) {
                    this.input.focus()
                    this.input.select()
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
        }
    }
    validate() {
        var errors = {}

        if (this.state.summoner_name.length === 0) {
            errors.search = 'Please type out a summoner\'s name.'
        }

        this.setState({errors: errors})
        return errors
    }
    search() {
        var errors = this.validate()

        if (Object.keys(errors).length === 0) {
            this.setState({to_summoner_page: true})
        }
    }
    render() {
        const store = this.props.store
        const theme = store.state.theme
        if (this.state.to_summoner_page) {
            return (
                <Redirect push to={`/${store.state.region_selected}/${this.state.summoner_name}/`} />
            )
        }
        return (
            <div>
                <div
                    style={{marginBottom: 0}}
                    className='row'>
                    <div className="col m2 s3">
                        <ReactTooltip
                            id='region-select-tooltip'
                            effect='solid' >
                            <span>Select Region</span>
                        </ReactTooltip>
                        <div
                            data-tip
                            data-for='region-select-tooltip'
                            className={`input-field ${store.state.theme}`}>
                            <select
                                onChange={(event) => store.setState({region_selected: event.target.value})}
                                value={store.state.region_selected}
                                ref={(elt) => {
                                    window.$(elt).formSelect()
                                }} >
                                {store.state.regions.map((region, key) => {
                                    return (
                                        <option
                                            key={key}
                                            value={region} >
                                            {region}
                                        </option>
                                    )
                                })}
                            </select>
                            <label>Region</label>
                        </div>
                    </div>
                    <div className="col m10 s9">
                            <ReactTooltip
                                id='search-field-tooltip'
                                effect='solid' >
                                <span>Press "/" to focus the search field.</span>
                            </ReactTooltip>
                            <div
                                data-tip
                                data-for='search-field-tooltip'
                                className="input-field">
                                <input
                                    ref={(elt) => {this.input = elt}}
                                    autoComplete='off'
                                    className={store.state.theme}
                                    id='summoner-search'
                                    type="text"
                                    value={this.state.summoner_name}
                                    onChange={(event) => this.setState({summoner_name: event.target.value})}
                                    onKeyDown={this.handleKeyDown} />
                                <label
                                    htmlFor="summoner-search">
                                    Summoner{' '}
                                    <span style={{
                                        borderWidth: 1,
                                        borderStyle: 'solid',
                                        borderRadius: 4,
                                        padding: '0px 7px 3px 7px',
                                    }}>
                                        /
                                    </span>
                                </label>
                                {this.state.errors.search !== undefined &&
                                    <div className={`helper-text ${theme} dark error`}>
                                        {this.state.errors.search}
                                    </div>
                                }
                            </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col s12">
                        <button
                            style={{width: '100%'}}
                            onClick={() => this.setState({to_summoner_page: true})}
                            className={`${theme} btn`}>
                            Search
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}
SummonerSearchField.propTypes = {
    store: PropTypes.object.isRequired,
    start_with_focus: PropTypes.bool,
    ignore_hotkeys: PropTypes.array,
}
SummonerSearchField.defaultProps = {
    start_with_focus: true,
    ignore_hotkeys: [],
}

export default SummonerSearchField