import React, { Component } from 'react'


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
                    </div>
                </div>
            </div>
        )
    }
}

export default SummonerNotFound