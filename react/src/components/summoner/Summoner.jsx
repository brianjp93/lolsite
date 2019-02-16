import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'

import api from '../../api/api'

class Summoner extends Component {
    constructor(props) {
        super(props)

        this.state = {
            summoner: {},
            icon: {},
            matches: [],

            is_requesting_page: false,
        }

        this.getSummonerPage = this.getSummonerPage.bind(this);
    }
    componentDidMount() {
        this.getSummonerPage()
    }
    getSummonerPage(callback) {
        this.setState({is_requesting_page: true})
        var data = {
            summoner_name: this.props.route.match.params.summoner_name,
            region: this.props.region,
            update: true,
        }
        api.player.getSummonerPage(data)
            .then((response) => {
                this.setState({
                    summoner: response.data.summoner,
                    region: this.props.region,
                    icon: response.data.profile_icon,
                    matches: response.data.matches,
                    is_requesting_page: false,
                }, () => {
                    if (callback !== undefined) {
                        callback()
                    }
                })
            })
            .catch((error) => {
                window.alert('No summoner with that name was found.')
                this.setState({is_requesting_page: false})
            })
    }
    render() {
        return (
            <div>
                <NavBar store={this.props.store} />
                {this.state.is_requesting_page &&
                    <div>
                        <div className="row">
                            <div className="col m3">
                                <div className={`card-panel ${this.props.store.state.theme}`}>
                                    <div style={{textAlign:'center'}}>
                                        LOADING DATA...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {!this.state.is_requesting_page &&
                    <>
                        <div style={{width:450, marginLeft:10}}>
                            {this.state.summoner.name !== undefined &&
                                <SummonerCard icon={this.state.icon} summoner={this.state.summoner} store={this.props.store} pageStore={this} />
                            }
                        </div>

                        <div>
                            <div className="horizontal-scroll">
                                {this.state.matches.map((match, key) => {
                                    return (
                                        <div
                                            key={`${key}-${match._id}`}
                                            style={{width:300, height:500, display: 'inline-block', margin: '0px 10px 25px 10px'}}
                                            className={`card-panel ${this.props.store.state.theme}`}>
                                            <p>Here is a paragraph</p>

                                            <p>Here is another one.</p>
                                            <p>and one more</p>
                                        </div>
                                    )
                                })}

                                <div style={{display: 'inline-block', width: 200}}></div>
                            </div>
                        </div>
                    </>
                }
            </div>
        )
    }
}


class SummonerCard extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }
    render() {
        return (
            <span>
                <div className={`card-panel ${this.props.store.state.theme}`}>
                    {this.props.icon.image_url !== undefined &&
                        <img
                            style={{
                                width:50,
                                display:'inline-block',
                                verticalAlign:'middle'
                            }}
                            src={this.props.icon.image_url}
                            alt={`profile icon ${this.props.icon._id}`}/>
                    }

                    <div
                        style={{
                            display: 'inline-block',
                            width:350,
                            maxWidth:'87%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            height:25,
                        }}>
                        {this.props.summoner.name}
                    </div>
                </div>
            </span>
        )
    }
}
SummonerCard.propTypes = {
    store: PropTypes.any,
    pageStore: PropTypes.any,
}

export default Summoner