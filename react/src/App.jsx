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
    componentDidUpdate(prevProps, prevState) {
        if (prevState.theme !== this.state.theme) {
            this.removeTheme(prevState.theme)
            this.setTheme(this.state.theme)
        }
    }
    componentDidMount() {
        this.setTheme(this.state.theme)

        var queue_elt = document.getElementById('queues')
        this.setState({queues: JSON.parse(queue_elt.innerHTML)})

        var static_base = document.getElementById('static-base')
        this.setState({static: static_base.innerHTML.trim()})
    }
    componentWillUnmount() {
    }
    setTheme(theme) {
        var elt = document.getElementsByTagName('html')[0]
        elt.classList.add(theme)
        elt.classList.add('background')
    }
    removeTheme(theme) {
        var elt = document.getElementsByTagName('html')[0]
        elt.classList.remove(theme)
        elt.classList.remove('background')
    }
    render() {
        return (
            <div id='background-div'>
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
