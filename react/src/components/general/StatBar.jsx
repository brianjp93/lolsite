import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import uuidv4 from 'uuid/v4'
import numeral from 'numeral'


class StatBar extends Component {
    constructor(props) {
        super(props)

        this.state = {}

        this.getTotal = this.getTotal.bind(this)
        this.getPercentage = this.getPercentage.bind(this)
    }
    getPercentage(val) {
        let out
        let total = this.getTotal()
        if (val === 1) {
            out = (this.props.val1 / total) * 100
        }
        else {
            out = (this.props.val2 / total) * 100
        }
        return out
    }
    getTotal() {
        return this.props.val1 + this.props.val2
    }
    render() {
        const id1 = uuidv4()
        const id2 = uuidv4()

        const color1 = {
            background: 'linear-gradient(81deg, rgba(40,212,180,1) 0%, rgb(58, 128, 157) 100%)',
        }
        const color2 = {
            background: 'linear-gradient(81deg, rgb(230, 136, 103) 0%, rgba(199,37,37,1) 100%)',
        }

        const border_radius = 5
        const barstyle = {
            height: 15,
            display: 'inline-block',
        }
        return (
            <div style={{display: 'inline-block', width: '100%'}}>
                <ReactTooltip
                    id={id1}
                    effect='solid' >
                    <span>
                        {numeral(this.getPercentage(1)).format('0.0')}%: {this.props.label1}
                    </span>
                </ReactTooltip>
                <div
                    data-tip
                    data-for={id1}
                    style={{
                        ...barstyle,
                        ...color1,
                        width: `${this.getPercentage(1)}%`,
                        borderTopLeftRadius: border_radius,
                        borderBottomLeftRadius: border_radius,
                    }}>
                </div>

                <ReactTooltip
                    id={id2}
                    effect='solid' >
                    <span>{numeral(this.getPercentage(2)).format('0.0')}%: {this.props.label2}</span>
                </ReactTooltip>
                <div
                    data-tip
                    data-for={id2}
                    style={{
                        ...barstyle,
                        ...color2,
                        width: `${this.getPercentage(2)}%`,
                        borderTopRightRadius: border_radius,
                        borderBottomRightRadius: border_radius,
                    }}>
                </div>
            </div>
        )
    }
}
StatBar.propTypes = {
    theme: PropTypes.string.isRequired,
    val1: PropTypes.number.isRequired,
    val2: PropTypes.number.isRequired,
    label1: PropTypes.object,
    label2: PropTypes.object,
}

export default StatBar
