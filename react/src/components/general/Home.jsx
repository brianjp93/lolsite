import { Component } from 'react'
import PropTypes from 'prop-types'
import NavBar from './NavBar'
import api from '../../api/api'
import Footer from './Footer'
import SummonerSearchField from '../summoner/SummonerSearchField'


class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
            summoner_name: '',
            to_summoner_page: false,

            message: {},
            fade_time: 1500,
            message_interval: null,
            messages_shown: 0,
        }

        this.quoteFadeIn = this.quoteFadeIn.bind(this)
        this.quoteFadeOut = this.quoteFadeOut.bind(this)
        this.getInspirationalMessage = this.getInspirationalMessage.bind(this)
    }
    componentDidMount() {
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
        let store = this.props.store
        return (
            <div>
                <div style={{minHeight: 1200}}>
                    <NavBar
                        store={store}
                        ignore_hotkeys={['s', '/']} />
                    <div style={{height:50}}></div>
                    <div className="row">
                        <div style={{display: 'flex'}}>
                            <img
                                style={{maxWidth: 400, margin: 'auto'}}
                                src={`${store.state.static}general/hardstuck-by-hand_2.png`} alt="" />
                        </div>
                        <div style={{height: 100, display: 'flex'}} className="col m3 offset-m4">
                            <span style={{marginTop: 'auto', marginBottom: 'auto'}}>
                                <blockquote
                                    title={this.state.message.hidden_message ? this.state.message.hidden_message : ''}
                                    style={{display:'none', marginTop: 0, marginBottom: 0}}
                                    ref={(elt) => {this.quote = elt}}
                                    className={`${store.state.theme}`}>
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
                        <div className="col l6 offset-l3 m8 offset-m2">
                            <SummonerSearchField store={store} />
                        </div>
                    </div>
                </div>

                <div>
                    <Footer store={store} />
                </div>
            </div>
        )
    }
}
Home.propTypes = {
    store: PropTypes.any,
}

export default Home
