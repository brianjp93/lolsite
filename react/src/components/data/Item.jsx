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
            <div style={{
                background: 'black',
                padding: 15,
                opacity: .9,
                maxWidth: 300,
                borderRadius: 10,
                zIndex: 11,
            }}>
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
        }
    }
    render() {
        if (this.props.item_id) {
            return (
                <Popover
                    isOpen={this.state.is_open}
                    position={'top'}
                    containerStyle={{'z-index': '11'}}
                    content={(
                        <Item item={this.props.item} />
                    )}
                >
                    <div
                        style={this.props.style}
                        onMouseOver={() => {
                            this.setState({is_open: true})
                            if (this.props.item === null) {
                                if (this.props.item_id) {
                                    this.props.pageStore.getItem(this.props.item_id, this.props.major, this.props.minor)
                                }
                            }
                        }}
                        onMouseOut={() => this.setState({is_open: false})}>
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