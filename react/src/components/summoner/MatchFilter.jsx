import React, { Component } from 'react'
import PropTypes from 'prop-types'

import queuefilter from '../../constants/queuefilter'


class MatchFilter extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }
    componentDidMount() {
        window.$('select').formSelect()
    }
    render() {
        const store = this.props.store
        const parent = this.props.parent
        const theme = store.state.theme
        return (
            <div>
                <div>
                    <div className={`input-field ${theme}`}>
                        <select
                            onChange={(elt) => {
                                parent.setState({queue_filter: elt.target.value}, () => {
                                    parent.reloadMatches()
                                })}
                            }
                            value={parent.state.queue_filter}>
                            {[{name: 'any', id: ''}].concat(queuefilter).map((queue, key) => {
                                return (
                                    <option key={`${queue.id}-${key}`} value={queue.id}>{queue.name}</option>
                                )
                            })}
                        </select>
                        <label>Queue</label>
                    </div>
                </div>
            </div>
        )
    }
}
MatchFilter.propTypes = {
    store: PropTypes.object.isRequired,
    parent: PropTypes.object.isRequired,
}

export default MatchFilter