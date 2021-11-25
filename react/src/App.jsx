import {Component} from 'react'
import {Switch, Route, withRouter} from 'react-router-dom'

import ReactGA from 'react-ga'
import Modal from 'react-modal'
import {HomeV2} from './components/general/HomeV2'
import Summoner from './components/summoner/Summoner'
import SignUp from './components/account/SignUp'
import LogIn from './components/account/LogIn'
import VerifyEmail from './components/account/VerifyEmail'
import Account from './components/account/Account'
import SetRoles from './components/summoner/SetRoles'
import {ItemChangesPage} from './components/item/itemchanges'
import {ItemsPage} from './components/item/items'
import {ItemStatPage} from './components/item/itemstats'
import {ChampionsPage} from './components/champion/champion'
import {NotificationPage} from './components/notification/notification'
import { QueryClient, QueryClientProvider } from 'react-query'

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import api from './api/api'

const trackingId = 'UA-153444087-1'
ReactGA.initialize(trackingId)

Sentry.init({
    dsn: "https://9596d6f2a197495094ea44d37f329c67@o77441.ingest.sentry.io/5990012",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

const queryClient = new QueryClient()

document.addEventListener('DOMContentLoaded', function() {
  const user_data = JSON.parse(document.getElementById('user-data').innerHTML)
  ReactGA.set({
    user_id: user_data.id,
    user_email: user_data.email,
  })
})

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      theme: 'dark',
      language: 'en_US',
      build: '',
      user: {},

      project_title: 'HardStuck',

      summoners: {},
      items: {},
      runes: {},
      favorites: [],

      queues: [],
      queue_convert: {},

      // whether or not to ignore vertical scroll conversion to horizontal
      ignore_horizontal: false,

      regions: ['na', 'euw', 'eune', 'kr', 'jp', 'lan', 'las', 'br', 'oce', 'tr', 'ru'],
      region_selected: 'na',

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

    // update location info for GA
    if (prevProps.location.pathname !== this.props.location.pathname) {
      ReactGA.set({page: this.props.location.pathname}) // Update the user's current page
      ReactGA.pageview(this.props.location.pathname) // Record a pageview for the given page
    }
  }
  componentDidMount() {
    this.setTheme(this.state.theme)

    var queue_elt = document.getElementById('queues')
    this.setState({queues: JSON.parse(queue_elt.innerHTML)}, this.setQueueDict)

    var static_base = document.getElementById('static-base')
    this.setState({static: static_base.innerHTML.trim()})

    var user_elt = document.getElementById('user-data')
    this.setState({user: JSON.parse(user_elt.innerHTML)})

    let favorite_elt = document.getElementById('favorite-data')
    this.setState({favorites: JSON.parse(favorite_elt.innerHTML)})

    let build_elt = document.getElementById('build-data')
    this.setState({build: build_elt.innerHTML.trim()})

    Modal.setAppElement('#app-wrap')
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
    api.data.getRunes(data).then((response) => {
      var data = response.data.data
      // var version = response.data.version
      var new_runes = this.formatRunes(data, version)
      this.setState({runes: new_runes})
      if (Object.keys(data).length === 0) {
        api.data.getRunes().then((response) => {
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
    for (var i = 0; i < data.length; i++) {
      rune = data[i]
      output[rune._id] = rune
    }
    new_runes[version] = output
    return new_runes
  }
  getRune(rune_id, version) {
    if (this.state.runes[version] === undefined) {
      return null
    } else {
      return this.state.runes[version][rune_id]
    }
  }
  render() {
    return (
      <div id="background-div">
        <QueryClientProvider client={queryClient}>
          <Routes store={this} />
        </QueryClientProvider>
      </div>
    )
  }
}

function Routes(props) {
  // if (['true', 'True', true].indexOf(props.store.props.allow_access) >= 0) {
  return (
    <main>
      <Switch>
        <Route exact path="/" render={() => <HomeV2 store={props.store} />} />

        {props.store.state.regions.map((region, key) => {
          return (
            <Route
              key={key}
              path={`/${region}/:summoner_name/match/:match_id/`}
              render={(rest) => <Summoner route={rest} region={region} store={props.store} />}
            />
          )
        })}

        {props.store.state.regions.map((region, key) => {
          return (
            <Route
              key={key}
              path={`/${region}/:summoner_name/`}
              render={(rest) => <Summoner route={rest} region={region} store={props.store} />}
            />
          )
        })}

        <Route
          exact
          path="/sign-up/"
          render={(rest) => <SignUp route={rest} store={props.store} />}
        />
        <Route exact path="/login/" render={(rest) => <LogIn route={rest} store={props.store} />} />
        <Route
          path="/verify/"
          render={(rest) => <VerifyEmail route={rest} store={props.store} />}
        />
        <Route path="/account/" render={(rest) => <Account route={rest} store={props.store} />} />
        <Route
          exact
          path="/notifications/"
          render={(rest) => <NotificationPage route={rest} store={props.store} />}
        />
        <Route
          exact
          path="/item/"
          render={(rest) => <ItemsPage route={rest} store={props.store} />}
        />
        <Route
          exact
          path="/item/stats/"
          render={(rest) => <ItemStatPage route={rest} store={props.store} />}
        />
        <Route
          exact
          path="/item/changes/"
          render={(rest) => <ItemChangesPage route={rest} store={props.store} />}
        />
        <Route
          exact
          path="/champion/"
          render={(rest) => <ChampionsPage route={rest} store={props.store} />}
        />

        <Route exact path="/set-roles/" render={() => <SetRoles store={props.store} />} />
      </Switch>
    </main>
  )
}

export default withRouter(App)
