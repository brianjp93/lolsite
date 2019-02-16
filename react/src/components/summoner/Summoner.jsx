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
                    <div className="row">
                        <div className="col m3">
                            {this.state.summoner.name !== undefined &&
                                <SummonerCard store={this.props.store} pageStore={this} />
                            }
                        </div>
                    </div>
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
                    {this.props.pageStore.state.icon.image_url !== undefined &&
                        <img
                            style={{height:50}}
                            src={this.props.pageStore.state.icon.image_url}
                            alt={`profile icon ${this.props.pageStore.state.icon._id}`}/>
                    }
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