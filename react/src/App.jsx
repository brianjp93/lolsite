import React, { Component } from 'react'
import {Switch, Route} from 'react-router-dom'
import Themes from './components/test/Themes'
import Home from './components/general/Home'
import Summoner from './components/summoner/Summoner'

// import { Cookies } from 'react-cookie';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            theme: 'dark',
            language: 'en_US',
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
                <Route path='/na/:summoner_name/' render={(rest) => <Summoner route={rest} region='na' store={props.store} />} />
                <Route exact path='/themes/' render={() => <Themes store={props.store}/>}/>
            </Switch>
        </main>
    )
}

export default App;
