import React, { Component } from 'react'
import NavBar from '../general/NavBar'


class SignUp extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    render() {
        var store = this.props.store
        return (
            <div>
                <NavBar store={store} region={store.selected_region} />
            </div>
        )
    }
}

export default SignUp