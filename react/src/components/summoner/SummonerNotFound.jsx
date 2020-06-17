import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SummonerSearchField from './SummonerSearchField'


class SummonerNotFound extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    render() {
        return (
            <div>
                <div className="row">
                    <div
                        className='col m6 offset-m3'
                        style={{
                            marginTop: 50,
                            textAlign: 'center',
                        }} >
                        <h3>
                            <em>* spam pings ? *</em>
                        </h3>
                        <div>That summoner couldn't be found for this region.</div>

                        <div style={{marginTop: 50}}>
                            <SummonerSearchField store={this.props.store} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
SummonerNotFound.propTypes = {
    store: PropTypes.object.isRequired,
}

export default SummonerNotFound
