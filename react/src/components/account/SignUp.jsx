import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'

import NavBar from '../general/NavBar'
import api from '../../api/api'
import Footer from '../general/Footer'


class SignUp extends Component {
    constructor(props) {
        super(props)

        this.state = {
            email: '',
            password: '',
            password_verify: '',

            validation: {},

            is_creating: false,
            is_await_validation: false,
        }
        this.createAccount = this.createAccount.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.helperElement = this.helperElement.bind(this)
        this.validate = this.validate.bind(this)
        this.validateEmail = this.validateEmail.bind(this)
        this.validatePassword = this.validatePassword.bind(this)
        this.validatePasswordVerify = this.validatePasswordVerify.bind(this)
    }
    componentDidMount() {
        try {
            this.email_field.focus()
            this.email_field.select()
        }
        catch(error) {

        }
    }
    validateEmail() {
        var errors = {}
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.state.email)
        if (!valid) {
            errors.email = 'Please enter a valid email address.'
        }
        return errors
    }
    validatePassword() {
        var errors = {}
        if (this.state.password.length <= 6) {
            errors.password = 'Please use a password with more than 6 characters.'
        }
        return errors
    }
    validatePasswordVerify() {
        var errors = {}
        if (this.state.password_verify !== this.state.password) {
            errors.password_verify = 'Your passwords did not match. Check to make sure you typed the password the way you intended.'
        }

        return errors
    }
    validate() {
        var errors = {}

        Object.assign(errors, this.validateEmail())
        Object.assign(errors, this.validatePassword())
        Object.assign(errors, this.validatePasswordVerify())

        this.setState({validation: errors})
        return errors
    }
    createAccount() {
        var errors = this.validate()
        if (Object.keys(errors).length === 0) {
            // no errors, continue

        }
    }
    helperElement(field) {
        if (this.state.validation[field] !== undefined) {
            return (
                <div className={`helper-text ${this.props.store.state.theme} error`}>
                    {this.state.validation[field]}
                </div>
            )
        }
        return null
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.createAccount()
            event.preventDefault()
            event.stopPropagation()
        }
    }
    render() {
        var store = this.props.store
        var theme = store.state.theme
        if (this.state.is_await_validation) {
            return (
                <div>
                    <NavBar store={store} />

                    <div style={{height: 100}}></div>

                    <div className="row">
                        <div className="col l4 offset-l4 m12">
                            <div className={`card-panel ${theme}`}>
                                <h4 style={{marginTop: 0, marginBottom: 0}}>
                                    Verify Your Email
                                </h4>
                                <hr style={{marginTop: 0, marginBottom: 30}} />

                                <div>
                                    Hey! We just sent you an email.  Once you verify your
                                    account you'll be able to login.
                                </div>

                                <div style={{marginTop: 20}}>
                                    <Link
                                        to='/login'
                                        style={{width: '100%'}}
                                        className={`${theme} btn btn-flat`}>
                                        Go to Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer store={store} />
                </div>
            )
        }
        else {
            return (
                <div>
                    <NavBar store={store} />

                    <div style={{height: 100}}></div>

                    <div className="row">
                        <div className="col l4 offset-l4 m12">
                            <div className={`card-panel ${theme}`}>

                                <h4 style={{marginTop: 0, marginBottom: 0}}>
                                    Sign Up
                                </h4>
                                <hr style={{marginTop: 0, marginBottom: 30}} />
                                <ReactTooltip id='email-tip' effect='solid'>
                                    <span>
                                        Please enter your email.
                                    </span>
                                </ReactTooltip>
                                <div
                                    data-tip
                                    data-for='email-tip'
                                    className="input-field">
                                    <input
                                        onKeyDown={this.handleKeyDown}
                                        ref={(elt) => {this.email_field = elt}}
                                        id='email-input-field'
                                        className={theme}
                                        value={this.state.email}
                                        onChange={(event) => this.setState({email: event.target.value})}
                                        type="text"/>
                                    <label htmlFor="email-input-field">Email</label>
                                    {this.helperElement('email')}
                                </div>

                                <ReactTooltip id='password-tip' effect='solid'>
                                    <span>Please enter a secure password.</span>
                                </ReactTooltip>
                                <div
                                    data-tip
                                    data-for='password-tip'
                                    className="input-field">
                                    <input
                                        onKeyDown={this.handleKeyDown}
                                        id='password-input'
                                        type="text"
                                        className={theme}
                                        value={this.state.password}
                                        onChange={(event) => this.setState({password: event.target.value})} />
                                    <label htmlFor="password-input">Password</label>
                                    {this.helperElement('password')}
                                </div>

                                <ReactTooltip id='password-verify-tip' effect='solid'>
                                    <span>Please re-type your password.</span>
                                </ReactTooltip>
                                <div
                                    data-tip
                                    data-for='password-verify-tip'
                                    className="input-field">
                                    <input
                                        onKeyDown={this.handleKeyDown}
                                        id='password-verify-input'
                                        type="text"
                                        className={theme}
                                        value={this.state.password}
                                        onChange={(event) => this.setState({password_verify: event.target.value})} />
                                    <label htmlFor="password-verify-input">Verify Password</label>
                                    {this.helperElement('password_verify')}
                                </div>

                                <div>
                                    <button
                                        style={{width: '100%'}}
                                        onClick={this.createAccount}
                                        className={`${theme} btn`}>
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer store={store} />
                </div>
            )
        }
    }
}
SignUp.propTypes = {
    store: PropTypes.object.isRequired,
}

export default SignUp