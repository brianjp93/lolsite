import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'


class NavBar extends Component {
    constructor(props)  {
        super(props)
        this.state = {
            summoner_name: '',

            redirect: false,
        }
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyListener = this.handleKeyListener.bind(this)
    }
    componentDidMount() {
        window.$('.sidenav').sidenav()

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
            if (this.state.summoner_name.length === 0) {
                // don't search
            }
            else {
                event.preventDefault()
                event.stopPropagation()
                this.setState({redirect: true})
            }
        }
        return event
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
                    <nav className={`${theme}`}>
                        <div className="nav-wrapper">
                            <Link
                                to='/'
                                className='left'
                                style={{marginLeft:10, padding:'0px 15px'}}
                            >
                                Logo
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
                                        <Link to='/themes/'>Themes</Link>
                                    </li>
                                </ul>
                            */}

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault()
                                }}
                                style={{display: 'inline-block', float: 'right', width: 350, marginRight: '10%'}}>

                                <div
                                    style={{width: 60, display: 'inline-block'}}
                                    className={`input-field ${store.state.theme}`}>
                                    <select
                                        ref={(elt) => {
                                            window.$(elt).formSelect()
                                        }}
                                        onChange={(event) => store.setState({region_selected: event.target.value})}
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
                                    style={{display: 'inline-block', width: 280}}
                                    className="input-field">
                                    <input
                                        ref={(elt) => this.input = elt}
                                        style={{color: '#929292'}}
                                        value={this.state.summoner_name}
                                        onChange={(event) => this.setState({summoner_name: event.target.value})}
                                        onKeyDown={this.handleKeyDown}
                                        id='summoner_search' type="search" />
                                    <label className="label-icon" htmlFor="summoner_search">
                                        <i className="material-icons">search</i>
                                    </label>
                                    <i className="material-icons">
                                        close
                                    </i>
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