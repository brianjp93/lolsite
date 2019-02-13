import React, { Component } from 'react';
import {Link} from 'react-router-dom';

class Themes extends Component {
    constructor(props)  {
        super(props);
        this.state = {
            choices: ['dark', 'light']
        }
    }
    render()  {
        return (
            <div>
                <div className="row">
                    <Link to='/'>Go Back Home</Link>
                </div>
                <div className="row">
                    {this.state.choices.map((choice, key) => {
                        return (
                            <span key={key}>
                                <label className={this.props.store.state.theme} htmlFor={`${key}-radio-theme`}>
                                    <input
                                        id={`${key}-radio-theme`}
                                        value={choice}
                                        type="radio"
                                        checked={this.props.store.state.theme === choice}
                                        onChange={(event) => this.props.store.setState({theme: event.target.value})}/>
                                        <span>{choice}</span>
                                </label>
                                <br/>
                            </span>
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default Themes;