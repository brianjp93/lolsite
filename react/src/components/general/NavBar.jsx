import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'
import api from '../../api/api'


class NavBar extends Component {
    constructor(props)  {
        super(props)
        this.state = {
            summoner_name: '',

            summoner_search: [],

            is_quicksearch_open: false,
            highlight_index: null,

            redirect: false,
        }
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyListener = this.handleKeyListener.bind(this)
        this.doSearch = this.doSearch.bind(this)
        this.quickSearchLine = this.quickSearchLine.bind(this)
    }
    componentDidMount() {
        window.$('.sidenav').sidenav()
        window.$('.dropdown-trigger').dropdown()

        window.addEventListener('keydown', this.handleKeyListener)

        if (this.props.region !== undefined) {
            this.props.store.setState({
                region_selected: this.props.region,
            })
        }
    }
    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyListener)
    }
    doSearch() {
        if (this.state.summoner_name.length >= 3) {
            let region = this.props.store.state.region_selected
            let name = this.state.summoner_name
            name = name.split(' ').join('').toLowerCase()
            let data = {
                simple_name__icontains: name,
                region: region,
                order_by: 'simple_name',
                start: 0,
                end: 10,
                fields: ['name', 'summoner_level'],
            }
            api.player.summonerSearch(data)
                .then(response => {
                    this.setState({summoner_search: response.data.data})
                })
                .catch(error => {
                    
                })
                .then(() => {
                    
                })
        }
        else {
            this.setState({summoner_search: []})
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
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            let name = this.state.summoner_name
            if (this.state.highlight_index >= 0) {
                try {
                    name = this.state.summoner_search[this.state.highlight_index].name
                }
                catch(error) {
                    name = this.state.summoner_name
                }
            }
            else {
                name = this.state.summoner_name
            }
            if (name.length === 0) {
                // don't search
            }
            else {
                event.preventDefault()
                event.stopPropagation()
                this.setState({summoner_name: name, redirect: true, is_quicksearch_open: false})
            }
        }
        else if (['ArrowUp', 'ArrowDown'].indexOf(event.key) >= 0) {
            event.preventDefault()
            event.stopPropagation()
            let index = this.state.highlight_index
            let top_index = this.state.summoner_search.length - 1
            if (index === null) {
                if (event.key === 'ArrowUp') {
                    index = top_index
                }
                else if (event.key === 'ArrowDown') {
                    index = 0
                }
            }
            else {
                if (event.key === 'ArrowUp') {
                    index--
                    if (index < 0) {
                        index = top_index
                    }
                }
                else if (event.key === 'ArrowDown') {
                    index++
                    if (index > top_index) {
                        index = 0
                    }
                }
            }
            this.setState({highlight_index: index})
        }
        return event
    }
    quickSearchLine(data, key) {
        let {name, summoner_level} = data
        let highlight_style = {}
        if (key === this.state.highlight_index) {
            highlight_style.backgroundColor = '#ffffff20'
        }
        return (
            <div
                onClick={() => this.setState({
                    summoner_name: name,
                    redirect: true,
                    is_quicksearch_open: false,
                })}
                style={{
                    padding: '0 10px',
                    cursor: 'pointer',
                    ...highlight_style
                }}
                className='hover-lighten'
                key={`${name}-${key}`}>
                <div
                    style={{
                        display: 'inline-block',
                        width: 50,
                    }}>
                    <span style={{
                        borderStyle: 'solid',
                        borderWidth: 1,
                        borderColor: 'grey',
                        borderRadius: 4,
                        fontSize: 'smaller',
                        padding: '2px 5px',
                    }}>
                        {summoner_level > 0 &&
                            <span>
                                {summoner_level}
                            </span>
                        }
                        {summoner_level === 0 &&
                            <span>NA</span>
                        }
                    </span>
                </div>
                <div style={{display: 'inline-block'}}>
                    {name}
                </div>
            </div>
        )
    }
    render() {
        var store = this.props.store
        let theme = store.state.theme
        // var region = store.state.region_selected
        if (this.state.redirect) {
            this.setState({redirect: false})
            return <Redirect push to={`/${store.state.region_selected}/${this.state.summoner_name}/`} />
        }
        else {
            return (
                <span>
                    <ul id="dropdown1" className="dropdown-content">
                        <li>
                            <a href="#!">one</a>
                        </li>
                    </ul>
                    <nav className={`${theme}`}>
                        <div className="nav-wrapper">
                            <Link
                                to='/'
                                className='left'
                                style={{marginLeft:10, padding:'0px 15px'}}
                            >
                                Home
                            </Link>
                            {
                                // eslint-disable-next-line
                            }<a
                                href='#' style={{cursor: 'pointer'}}
                                data-target="mobile-navbar"
                                className="sidenav-trigger" >
                                <i className="material-icons">menu</i>
                            </a>

                            {/*
                                <ul className="left hide-on-med-and-down">
                                    <li>
                                        <a class="dropdown-trigger" href="#!" data-target="dropdown1">
                                            Account
                                            <i class="material-icons right">arrow_drop_down</i>
                                        </a>
                                    </li>
                                </ul>
                            */}

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault()
                                }}
                                style={{
                                    display: 'inline-block',
                                    width: 350,
                                    background: '#ffffff20',
                                }}>

                                <div
                                    style={{
                                        width: 60,
                                        display: 'inline-block',
                                        paddingLeft: 15,
                                    }}
                                    className={`input-field ${store.state.theme}`}>
                                    <select
                                        ref={(elt) => {
                                            window.$(elt).formSelect()
                                        }}
                                        onChange={(event) => {
                                            store.setState({region_selected: event.target.value}, () => {
                                                this.doSearch()
                                            })
                                        }}
                                        value={store.state.region_selected} >
                                        {store.state.regions.map((_region, key) => {
                                            return (
                                                <option
                                                    key={key}
                                                    value={_region} >
                                                    {_region}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div
                                    style={{display: 'inline-block', width: 280, position: 'relative'}}
                                    className="input-field">
                                    <input
                                        autoComplete='off'
                                        ref={(elt) => this.input = elt}
                                        style={{color: '#929292'}}
                                        value={this.state.summoner_name}
                                        onChange={(event) => {
                                            this.setState({summoner_name: event.target.value, highlight_index: null}, () => {
                                                this.doSearch()
                                            })
                                        }}
                                        onFocus={() => this.setState({is_quicksearch_open: true})}
                                        onKeyDown={this.handleKeyDown}
                                        id='summoner_search' type="search" />
                                    <label className="label-icon" htmlFor="summoner_search">
                                        <i className="material-icons">search</i>
                                    </label>
                                    <i className="material-icons">
                                        close
                                    </i>
                                    {this.state.is_quicksearch_open &&
                                        <div
                                            className={`${theme} card-panel`}
                                            style={{
                                                position: 'absolute',
                                                width: 350,
                                                top: 60,
                                                left: -60,
                                                zIndex: 11,
                                                padding: 0,
                                            }}>
                                            <div style={{textAlign: 'center'}}>
                                                <button
                                                    onClick={() => this.setState({is_quicksearch_open: false})}
                                                    className={`${theme} btn-small`}
                                                    style={{width: '90%', textAlign: 'center'}}>
                                                    close
                                                </button>
                                            </div>
                                            {this.state.summoner_search.length === 0 &&
                                                <div
                                                    style={{padding: '0 10px'}}
                                                    className="error-bordered">
                                                    No matches.
                                                </div>
                                            }
                                            {this.state.summoner_search.map((data, key) => {
                                                return this.quickSearchLine(data, key)
                                            })}
                                        </div>
                                    }
                                </div>
                            </form>
                        </div>
                    </nav>

                    {/* MOBILE BAR */}
                    {/*
                        <ul className={`sidenav ${theme}`} id="mobile-navbar">
                            <li>
                                <Link to='/themes/'>Themes</Link>
                            </li>
                        </ul>
                    */}
                </span>
            )
        }
    }
}
NavBar.propTypes = {
    store: PropTypes.any,
    ignore_hotkeys: PropTypes.array,
}
NavBar.defaultProps = {
    ignore_hotkeys: [],
}

export default NavBar