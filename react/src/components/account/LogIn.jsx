import {Component} from 'react'
import {Link, Redirect} from 'react-router-dom'
import ReactGA from 'react-ga'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import queryString from 'query-string'
import api from '../../api/api'
import toastr from 'toastr'

import Skeleton from '../general/Skeleton'

class LogIn extends Component {
  constructor(props) {
    super(props)

    this.state = {
      email: '',
      password: '',

      errors: {},

      is_logged_in: false,

      is_logging_in: false,
      to_home_page: false,

      is_show_login_error: false,
      is_needs_verification: false,
    }

    this.validate = this.validate.bind(this)
    this.login = this.login.bind(this)
    this.getHelpText = this.getHelpText.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.verifyLoggedIn = this.verifyLoggedIn.bind(this)
  }
  componentDidMount() {
    ReactTooltip.rebuild()
    ReactGA.event({
      category: 'Log In',
      action: 'LogIn page was mounted.',
    })

    var query_string = this.props.route.location.search
    const values = queryString.parse(query_string)
    if (values.error === 'true') {
      this.setState({is_show_login_error: true})
    } else if (values.error === 'verification') {
      this.setState({is_needs_verification: true})
    } else {
      this.verifyLoggedIn()
    }
  }
  verifyLoggedIn() {
    api.player
      .isLoggedIn()
      .then((response) => {
        if (response.data.data.is_logged_in) {
          this.setState({is_logged_in: true})
        }
      })
      .catch((error) => {
        toastr.error("Couldn't check if user is logged in.")
      })
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

      this.setState({is_logging_in: true})
      this.form.submit()
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
    if (this.state.is_logged_in) {
      return <Redirect push to={`/`} />
    } else {
      return (
        <div>
          <Skeleton store={store}>
            <div className="row">
              <div className="col m6 offset-m3 s12">
                <form
                  ref={(elt) => {
                    this.form = elt
                  }}
                  id="login-form"
                  method="post"
                  action="/login/go/"
                >
                  <h4 style={{textAlign: 'center'}}>Log In</h4>

                  {this.state.is_show_login_error && (
                    <div style={{margin: '30px 0px'}} className={`${theme} error-bordered`}>
                      <span>Your username or password was incorrect.</span>
                    </div>
                  )}
                  {this.state.is_needs_verification && (
                    <div style={{margin: '30px 0px'}} className={`${theme} error-bordered`}>
                      <span>
                        This account exists but the email needs to be verified. Please check your
                        inbox for a verification email. It may be in your spam folder.
                      </span>
                    </div>
                  )}

                  {/* CSRF Input Field */}
                  <input
                    name="csrfmiddlewaretoken"
                    type="hidden"
                    defaultValue={store.props.csrf_token}
                  />

                  <div data-tip="Enter your email address." className="input-field">
                    <input
                      name="email"
                      onKeyDown={this.handleKeyDown}
                      className={theme}
                      id="email-input-field"
                      value={this.state.email}
                      onChange={(event) => this.setState({email: event.target.value})}
                      type="text"
                    />
                    <label htmlFor="email-input-field">Email</label>
                    {this.getHelpText('email')}
                  </div>

                  <div
                    data-tip="Enter your password."
                    data-for="password-tip"
                    className="input-field"
                  >
                    <input
                      name="password"
                      onKeyDown={this.handleKeyDown}
                      className={theme}
                      id="password-input-field"
                      value={this.state.password}
                      onChange={(event) => this.setState({password: event.target.value})}
                      type="password"
                    />
                    <label htmlFor="password-input-field">Password</label>
                    {this.getHelpText('password')}
                  </div>

                  <button onClick={this.login} style={{width: '100%'}} className={`btn ${theme}`}>
                    Log In
                  </button>
                </form>

                <div style={{marginTop: 5}}>
                  <span>No account?</span> <Link to="/sign-up/">Sign Up!</Link>
                </div>
              </div>
            </div>
          </Skeleton>
        </div>
      )
    }
  }
}
LogIn.propTypes = {
  store: PropTypes.object.isRequired,
}

export default LogIn
