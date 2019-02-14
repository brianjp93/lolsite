import React, { Component } from 'react'
import {Switch, Route} from 'react-router-dom'
import Themes from './components/test/Themes'
import Home from './components/general/Home'

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
                <Route exact path='/themes/' render={() => <Themes store={props.store}/>}/>
            </Switch>
        </main>
    )
}

export default App;
