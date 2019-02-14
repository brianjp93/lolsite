import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'


class NavBar extends Component {
    render() {
        return (
            <nav className={`${this.props.store.state.theme}`}>
                <div className="nav-wrapper">
                    <Link
                        to='/'
                        className='left'
                        style={{marginLeft:10, padding:'0px 15px'}}
                    >
                        Logo
                    </Link>
                    <ul className="left hide-on-med-and-down">
                        <li>
                            <Link to='/themes/'>Themes</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        )
    }
}
NavBar.propTypes = {
    store: PropTypes.any
}

export default NavBar