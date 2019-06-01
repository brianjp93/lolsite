import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'

import api from '../../api/api'
import NavBar from '../general/NavBar'
import Footer from '../general/Footer'


class LogIn extends Component {
    constructor(props) {
        super(props)

        this.state = {
            email: '',
            password: '',
        }
    }
    render() {
        var store = this.props.store
        var theme = store.state.theme
        return (
            <div>
                <NavBar store={store} />

                <div style={{height: 150}}></div>

                <div className="row">
                    <div className="col m6 offset-m3 s12">

                            <h4 style={{textAlign: 'center'}}>Log In</h4>

                            <ReactTooltip
                                effect='solid'
                                id='email-tip'>
                                <span>Enter your email address.</span>
                            </ReactTooltip>
                            <div
                                data-tip
                                data-for='email-tip'
                                className="input-field">
                                <input
                                    className={theme}
                                    id='email-input-field'
                                    value={this.state.email}
                                    onChange={(event) => this.setState({email: event.target.value})}
                                    type="text" />
                                <label htmlFor="email-input-field">Email</label>
                            </div>

                            <ReactTooltip
                                effect='solid'
                                id='password-tip' >
                                <span>Enter your password.</span>
                            </ReactTooltip>
                            <div
                                data-tip
                                data-for='password-tip'
                                className="input-field">
                                <input
                                    className={theme}
                                    id='password-input-field'
                                    value={this.state.password}
                                    onChange={(event) => this.setState({password: event.target.value})}
                                    type="text" />
                                <label htmlFor="password-input-field">Password</label>
                            </div>

                            <button
                                style={{width: '100%'}}
                                className={`btn ${theme}`}>
                                Log In
                            </button>
                    </div>
                </div>

                <Footer store={store} />
            </div>
        )
    }
}

export default LogIn