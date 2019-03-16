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
    }
    componentDidMount() {
        window.$('.sidenav').sidenav()
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            event.stopPropagation()
            this.setState({redirect: true})
        }
        return event
    }
    render() {
        let theme = this.props.store.state.theme
        let region = 'na'
        if (this.state.redirect) {
            this.setState({redirect: false})
            return <Redirect push to={`/${region}/${this.state.summoner_name}/`} />
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
                            <ul className="left hide-on-med-and-down">
                                <li>
                                    <Link to='/themes/'>Themes</Link>
                                </li>
                            </ul>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault()
                                }}
                                style={{display: 'inline-block', float: 'right', width: 300, marginRight: '10%'}}>
                                <div className="input-field">
                                    <input
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
                    <ul className={`sidenav ${theme}`} id="mobile-navbar">
                        <li>
                            <Link to='/themes/'>Themes</Link>
                        </li>
                    </ul>
                </span>
            )
        }
    }
}
NavBar.propTypes = {
    store: PropTypes.any
}

export default NavBar