import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import ReactTooltip from 'react-tooltip'
import AtomSpinner from '@bit/bondz.react-epic-spinners.atom-spinner'

import api from '../../api/api'
import NavBar from '../general/NavBar'
import Footer from '../general/Footer'


class VerifyEmail extends Component {
    constructor(props) {
        super(props)

        this.state = {
            is_verifying: false,
            code: '',

            show_message: 'processing', // processing, error, success
        }

        this.verify = this.verify.bind(this)
    }
    componentDidMount() {
        const params = queryString.parse(this.props.route.location.search)
        if (params.code !== undefined) {
            this.setState({code: params.code}, () => {
                if (this.state.code.length > 0) {
                    this.verify()
                }
            })
        }
        else {
            this.setState({show_message: 'error'})
        }
    }
    verify() {
        this.setState({is_verifying: true})
        var data = {code: this.state.code}
        api.player.verify(data)
            .then(response => {
                console.log(response)
                this.setState({show_message: 'success'})
            })
            .catch(error => {
                this.setState({show_message: 'error'})
            })
            .then(() => {
                this.setState({is_verifying: false})
            })
    }
    render() {
        const store = this.props.store
        const theme = store.state.theme
        return (
            <div>
                <NavBar store={store} />
                
                <div style={{height: 130}}></div>
                <div className="row">
                    <div
                        style={{textAlign: 'center'}}
                        className="col m6 offset-m3 s12">
                        {this.state.show_message === 'processing' &&
                            <div>
                                Attempting to verify email...
                                <span>{' '}
                                    <AtomSpinner
                                        color='#ffffff'
                                        size={50}
                                        style={{
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                        }} />
                                </span>
                            </div>
                        }
                        {this.state.show_message === 'error' &&
                            <div className={`${theme} error-bordered`}>
                                The code could not be verified.  It either did not exist, or was too{' '}
                                old.  Try requesting a new verification email.
                            </div>
                        }
                        {this.state.show_message === 'success' &&
                            <div className={`${theme} success-bordered`}>
                                Thanks for verifying your email!

                                <div style={{marginTop: 20}}>
                                    <Link
                                        to='/login'
                                        style={{width: '100%'}}
                                        className={`${theme} btn btn-flat`}>
                                        Go to Login
                                    </Link>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <Footer store={store} />
            </div>
        )
    }
}

export default VerifyEmail