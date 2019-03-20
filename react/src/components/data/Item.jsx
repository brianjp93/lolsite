import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Popover from 'react-tiny-popover'


class Item extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }
    render() {
        var item = this.props.item
        return (
            <div style={{...this.props.tooltip_style}}>
                {item === null &&
                    <span>Retrieving item...</span>
                }
                {item !== null &&
                    <div>
                        <div>
                            <span style={{textDecoration:'underline'}}>{item.name}</span>{' '}
                            <span style={{color: 'gold'}}>
                                {item.gold.total}
                            </span>
                        </div>
                        <div>
                            <small dangerouslySetInnerHTML={{__html: item.description}}></small>
                        </div>
                    </div>
                }
            </div>
        )
    }
}
Item.propTypes = {
    style: PropTypes.object,
    item: PropTypes.object,
}
Item.defaultProps = {
    style: {},
    item: null,
}

class ItemPopover extends Component {
    constructor(props) {
        super(props)
        this.state = {
            is_open: false,
            attempted_get: false,
        }
        this.toggle = this.toggle.bind(this)
        this.handleOutsideClick = this.handleOutsideClick.bind(this)
    }
    componentDidMount() {
        if (this.props.item_id) {
            window.addEventListener('mousedown', this.handleOutsideClick)
        }
    }
    componentWillUnmount() {
        if (this.props.item_id) {
            window.removeEventListener('mousedown', this.handleOutsideClick)
        }
    }
    handleOutsideClick(event) {
        if (this.refs.target_elt.contains(event.target)) {
            // click was inside
        }
        else {
            if (this.state.is_open) {
                this.setState({is_open: false})
            }
        }
    }
    toggle() {
        this.setState({is_open: !this.state.is_open})
        if (this.props.item === null && this.state.attempted_get === false) {
            if (this.props.item_id) {
                this.props.pageStore.getItem(this.props.item_id, this.props.major, this.props.minor)
                this.setState({attempted_get: true})
            }
        }
    }
    render() {
        if (this.props.item_id) {
            return (
                <Popover
                    transitionDuration={0.01}
                    isOpen={this.state.is_open}
                    position={'top'}
                    containerStyle={{'z-index': '11'}}
                    content={(
                        <Item item={this.props.item} tooltip_style={this.props.tooltip_style} />
                    )} >
                    <div
                        ref='target_elt'
                        style={{...this.props.style, cursor: 'pointer'}}
                        onClick={this.toggle} >
                        {this.props.children}
                    </div>
                </Popover>
            )
        }
        else {
            return (
                <div style={this.props.style}>
                    {this.props.children}
                </div>
            )
        }
    }
}

export default {Item, ItemPopover}