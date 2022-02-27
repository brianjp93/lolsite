// components/general/DemoLogin.jsx

import React, { Component } from 'react'
import api from '../../api/api'


class DemoLogin extends Component {
    constructor(props) {
        super(props)
        this.state = {
            password: '',
            error_message: '',
        }

        this.handleKeyDown = this.handleKeyDown.bind(this)
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            if (this.state.password.length > 0) {
                var data = {password: this.state.password}
                api.general.demoLogin(data)
                    .then(response => {
                        window.location.href = '/'
                    })
                    .catch(error => {
                        this.setState({error_message: 'The passphrase was incorrect.'})
                    })
            }
        }
    }
    render() {
        let theme = this.props.store.state.theme
        return (
            <div>
                <div className="row">
                    <div className="col l6 offset-l3 m12">
                        <div style={{paddingTop: 200}}>
                            {this.state.error_message &&
                                <div style={{}}>
                                    {this.state.error_message}
                                </div>
                            }
                            {!this.state.error_message &&
                                <div>
                                    This site is not currently open for public consumption, however if you{' '}
                                    have the passphrase you may enter it here to use the site!
                                </div>
                            }
                        </div>
                        <div className="input-field">
                            <input
                                className={theme}
                                id='demo-login'
                                type="password"
                                value={this.state.password}
                                onChange={(event) => this.setState({password: event.target.value})}
                                onKeyDown={this.handleKeyDown}
                            />
                            <label htmlFor="demo-login">Access Phrase</label>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default DemoLogin