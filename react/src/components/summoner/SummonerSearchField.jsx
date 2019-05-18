import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'


class SummonerSearchField extends Component {
    constructor(props) {
        super(props)
        this.state = {
            summoner_name: '',
            to_summoner_page: false,
        }

        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyListener = this.handleKeyListener.bind(this)
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
            this.setState({to_summoner_page: true});
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
    render() {
        const store = this.props.store
        if (this.state.to_summoner_page) {
            return (
                <Redirect push to={`/${store.state.region_selected}/${this.state.summoner_name}/`} />
            )
        }
        return (
            <div>
                <div className="col m2 s3">
                        <div className={`input-field ${store.state.theme}`}>
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
                        <div className="input-field">
                            <input
                                ref={(elt) => {
                                    this.input = elt
                                }}
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