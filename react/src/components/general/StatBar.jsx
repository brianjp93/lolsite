import {Component} from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
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
    } else {
      out = (this.props.val2 / total) * 100
    }
    return out
  }
  componentDidUpdate() {
    ReactTooltip.rebuild()
  }
  getTotal() {
    return this.props.val1 + this.props.val2
  }
  render() {
    return (
      <div style={{display: 'inline-block', width: '100%'}}>
        <div
          data-tip={`${numeral(this.getPercentage(1)).format('0.0')}%: ${this.props.label1}`}
          className="winning-bar"
          style={{width: `${this.getPercentage(1)}%`}}
        ></div>

        <div
          data-tip={`${numeral(this.getPercentage(2)).format('0.0')}%: ${this.props.label2}`}
          className="losing-bar"
          style={{width: `${this.getPercentage(2)}%`}}
        ></div>
      </div>
    )
  }
}
StatBar.propTypes = {
  theme: PropTypes.string.isRequired,
  val1: PropTypes.number.isRequired,
  val2: PropTypes.number.isRequired,
  label1: PropTypes.string,
  label2: PropTypes.string,
}

export default StatBar
