import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NavBar from './NavBar'


class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
            regions: ['na'],
            region_selected: 'na',
        }
    }
    componentDidMount() {
        window.$('select').formSelect()
    }
    render() {
        return (
            <div>
                <NavBar store={this.props.store} />
                <div style={{height:100}}></div>
                <div className="row">
                    <div className="col m2 offset-m4">
                        <blockquote className={`${this.props.store.state.theme}`}>
                            <span title='or else'>Eat your vegetables</span>
                        </blockquote>
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
                            <input className={this.props.store.state.theme} id='summoner-search' type="text"/>
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