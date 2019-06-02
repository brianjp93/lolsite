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

            errors: {},
        }

        this.validate = this.validate.bind(this)
        this.login = this.login.bind(this)
        this.getHelpText = this.getHelpText.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
    }
    validate() {
        var errors = {}

        if (this.state.email.length === 0) {
            errors.email = 'Please enter an email.'
        }
        if (this.state.password.length === 0) {
            errors.password = 'Please enter a password.'
        }

        this.setState({errors: errors})
        return errors
    }
    login() {
        var errors = this.validate()

        if (Object.keys(errors).length === 0) {
            // Good - No errors
        }
    }
    getHelpText(field) {
        var elt = null
        if (this.state.errors[field] !== undefined) {
            elt = (
                <div className={`helper-text ${this.props.store.state.theme} error`}>
                    {this.state.errors[field]}
                </div>
            )
        }
        return elt
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.login()
            event.preventDefault()
            event.stopPropagation()
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
                                    onKeyDown={this.handleKeyDown}
                                    className={theme}
                                    id='email-input-field'
                                    value={this.state.email}
                                    onChange={(event) => this.setState({email: event.target.value})}
                                    type="text" />
                                <label htmlFor="email-input-field">Email</label>
                                {this.getHelpText('email')}
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
                                    onKeyDown={this.handleKeyDown}
                                    className={theme}
                                    id='password-input-field'
                                    value={this.state.password}
                                    onChange={(event) => this.setState({password: event.target.value})}
                                    type="text" />
                                <label htmlFor="password-input-field">Password</label>
                                {this.getHelpText('password')}
                            </div>

                            <button
                                onClick={this.login}
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