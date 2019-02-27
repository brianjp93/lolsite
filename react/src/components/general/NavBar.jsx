import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'


class NavBar extends Component {
    componentDidMount() {
        window.$('.sidenav').sidenav()
    }
    render() {
        return (
            <span>
                <nav className={`${this.props.store.state.theme}`}>
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
                    </div>
                </nav>

                {/* MOBILE BAR */}
                <ul className={`sidenav ${this.props.store.state.theme}`} id="mobile-navbar">
                    <li>
                        <Link to='/themes/'>Themes</Link>
                    </li>
                </ul>
            </span>
        )
    }
}
NavBar.propTypes = {
    store: PropTypes.any
}

export default NavBar