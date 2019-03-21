import React, { Component } from 'react'
import {Switch, Route} from 'react-router-dom'
import Themes from './components/test/Themes'
import Home from './components/general/Home'
import Summoner from './components/summoner/Summoner'

import api from './api/api'

// import { Cookies } from 'react-cookie';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            theme: 'dark',
            language: 'en_US',

            project_title: 'Press R',

            summoners: {},
            items: {},
            runes: {},

            queues: [],
            queue_convert: {},

            // whether or not to ignore vertical scroll conversion to horizontal
            ignore_horizontal: false,

            tooltip_style: {
                background: 'black',
                padding: 15,
                opacity: .9,
                maxWidth: 300,
                borderRadius: 10,
            },

            // hotkey - ignore if target is one of the following tags
            ignore_tags: new Set(['input', 'textarea']),
        }

        this.getRunes = this.getRunes.bind(this)
        this.getRune = this.getRune.bind(this)
        this.setQueueDict = this.setQueueDict.bind(this)
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
        this.setState({queues: JSON.parse(queue_elt.innerHTML)}, this.setQueueDict)

        var static_base = document.getElementById('static-base')
        this.setState({static: static_base.innerHTML.trim()})
    }
    componentWillUnmount() {
    }
    setQueueDict() {
        var queues = this.state.queues
        var qdict = {}
        for (var q of queues) {
            q.description = q.description.replace('games', '').trim()
            qdict[q._id] = q
        }
        this.setState({queue_convert: qdict})
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
    getRunes(version) {
        var data = {version: version}
        api.data.getRunes(data)
            .then(response => {
                var data = response.data.data
                var version = response.data.version
                var new_runes = this.formatRunes(data, version)
                this.setState({runes: new_runes})
                if (Object.keys(data).length === 0) {
                    api.data.getRunes()
                        .then(response => {
                            data = response.data.data
                            version = response.data.version
                            new_runes = this.formatRunes(data, version)
                            this.setState({runes: new_runes})
                        })

                }
            })
    }
    formatRunes(data, version) {
        var rune
        var output = {}
        var new_runes = this.state.runes
        for (var i=0; i<data.length; i++) {
            rune = data[i]
            output[rune._id] = rune
        }
        new_runes[version] = output
        return new_runes
    }
    getRune(rune_id, version) {
        if (this.state.runes[version] === undefined) {
            return null
        }
        else {
            return this.state.runes[version][rune_id]
        }
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
                <Route path='/kr/:summoner_name/' render={(rest) => <Summoner route={rest} region='kr' store={props.store} />} />
                <Route path='/euw/:summoner_name/' render={(rest) => <Summoner route={rest} region='euw' store={props.store} />} />
                <Route path='/eune/:summoner_name/' render={(rest) => <Summoner route={rest} region='eune' store={props.store} />} />
                <Route path='/jp/:summoner_name/' render={(rest) => <Summoner route={rest} region='jp' store={props.store} />} />
                <Route path='/br/:summoner_name/' render={(rest) => <Summoner route={rest} region='br' store={props.store} />} />
                <Route path='/lan/:summoner_name/' render={(rest) => <Summoner route={rest} region='lan' store={props.store} />} />
                <Route path='/las/:summoner_name/' render={(rest) => <Summoner route={rest} region='las' store={props.store} />} />
                <Route path='/oce/:summoner_name/' render={(rest) => <Summoner route={rest} region='oce' store={props.store} />} />
                <Route path='/tr/:summoner_name/' render={(rest) => <Summoner route={rest} region='tr' store={props.store} />} />
                <Route path='/ru/:summoner_name/' render={(rest) => <Summoner route={rest} region='ru' store={props.store} />} />

                <Route exact path='/themes/' render={() => <Themes store={props.store}/>}/>
            </Switch>
        </main>
    )
}

export default App;
