import React, { Component } from 'react';
import {Switch, Route, Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import Themes from './components/test/Themes';

// import { Cookies } from 'react-cookie';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            theme: 'dark',
        }
    }
    ComponentWillMount() {
    }
    render() {
        return (
            <div className={`${this.state.theme} background`}>
                <Routes store={this} />
            </div>
        );
    }
}

function Routes(props) {
    return (
        <main>
            <Switch>
                <Route exact path='/' render={() => <Home store={props.store}/>}/>
                <Route exact path='/test/' render={() => <Test store={props.store}/>}/>
                <Route exact path='/themes/' render={() => <Themes store={props.store}/>}/>
            </Switch>
        </main>
    )
}

class Home extends Component {
    render() {
        return (
            <div>
                <div className="row">
                    <div className="col s6 offset-s3">
                        <Link to='/themes/'>Themes</Link>
                    </div>
                </div>
                <div className="row">
                    <div className="col s6 offset-s3">
                        <div className="input-field">
                            <input className={this.props.store.state.theme} id='summoner-search' type="text"/>
                            <label htmlFor="summoner-search">Summoner</label>
                            <div>How are you?</div>
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


class Test extends Component {
    render() {
        return (
            <div>
                THIS IS A TEST PAGE
                <Link to='/'>Go Home</Link>
            </div>
        )
    }
}

export default App;
