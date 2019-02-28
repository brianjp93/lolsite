import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'
import NavBar from './NavBar'
import api from '../../api/api'


class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
            regions: ['na'],
            region_selected: 'na',

            summoner_name: '',
            to_summoner_page: false,

            message: {},
            fade_time: 1500,
            message_interval: null,
            messages_shown: 0,
        }

        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.quoteFadeIn = this.quoteFadeIn.bind(this)
        this.quoteFadeOut = this.quoteFadeOut.bind(this)
        this.getInspirationalMessage = this.getInspirationalMessage.bind(this)
    }
    componentDidMount() {
        window.$('select').formSelect()

        this.getInspirationalMessage()
        var message_interval = window.setInterval(this.getInspirationalMessage, 20 * 1000)
        this.setState({message_interval: message_interval})
    }
    componentWillUnmount() {
        window.clearInterval(this.state.message_interval)
    }
    getInspirationalMessage() {
        api.fun.getInspirationalMessage({random: true})
            .then((response) => {
                if (this.state.message.message === undefined) {
                    this.setState({
                        message: response.data.message,
                        messages_shown: this.state.messages_shown + 1,
                    })
                    this.quoteFadeIn()
                }
                else {
                    this.quoteFadeOut(() => {
                        this.setState({
                            message: response.data.message,
                            messages_shown: this.state.messages_shown + 1,
                        })
                        this.quoteFadeIn()
                    })
                }
            })
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            this.setState({to_summoner_page: true});
        }
    }
    quoteFadeIn(callback) {
        window.$(this.quote).fadeIn(this.state.fade_time)
        if (callback !== undefined) {
            setTimeout(callback, this.state.fade_time)
        }
    }
    quoteFadeOut(callback) {
        window.$(this.quote).fadeOut(this.state.fade_time)
        if (callback !== undefined) {
            setTimeout(callback, this.state.fade_time)
        }
    }
    render() {
        if (this.state.to_summoner_page) {
            return (
                <Redirect push to={`/${this.state.region_selected}/${this.state.summoner_name}/`} />
            )
        }
        return (
            <div>
                <NavBar store={this.props.store} />
                <div style={{height:100}}></div>
                <div className="row">
                    <div style={{height:150}} className="col m2 offset-m4">
                        <span>
                            <blockquote
                                title={this.state.message.hidden_message ? this.state.message.hidden_message : ''}
                                style={{display:'none'}}
                                ref={(elt) => {this.quote = elt}}
                                className={`${this.props.store.state.theme}`}>
                                <span>
                                    {this.state.message.message ? this.state.message.message : ''}
                                </span>
                                {['', undefined].indexOf(this.state.message.author) === -1 &&
                                    <span>
                                        <br/>
                                        <small>- {this.state.message.author}</small>
                                    </span>
                                }
                            </blockquote>
                        </span>
                    </div>
                </div>
                <div style={{padding: '0px 10px'}} className="row">
                    <div className="col m1 s2 offset-m3">
                        <div className={`input-field ${this.props.store.state.theme}`}>
                            <select
                                onChange={(event) => this.setState({region_selected: event.target.value})}
                                value={this.state.region_selected}
                            >
                                {this.state.regions.map((region, key) => {
                                    return (
                                        <option
                                            key={key}
                                            value={region}
                                        >
                                            {region}
                                        </option>
                                    )
                                })}
                            </select>
                            <label>Region</label>
                        </div>
                    </div>
                    <div className="col m5 s10">
                        <div className="input-field">
                            <input
                                className={this.props.store.state.theme}
                                id='summoner-search'
                                type="text"
                                value={this.state.summoner_name}
                                onChange={(event) => this.setState({summoner_name: event.target.value})}
                                onKeyDown={this.handleKeyDown}
                            />
                            <label htmlFor="summoner-search">Summoner</label>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
Home.propTypes = {
    store: PropTypes.any,
}

export default Home