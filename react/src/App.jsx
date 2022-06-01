import {Component} from 'react'
import {Switch, Route, withRouter} from 'react-router-dom'

import Modal from 'react-modal'
import {HomeV2} from './components/general/HomeV2'
import {Summoner} from './components/summoner/Summoner'
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
import ReactTooltip from 'react-tooltip'
import {RecoilRoot} from 'recoil'

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

Sentry.init({
    dsn: "https://9596d6f2a197495094ea44d37f329c67@o77441.ingest.sentry.io/5990012",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

const queryClient = new QueryClient()

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

    this.setQueueDict = this.setQueueDict.bind(this)
  }
  componentDidUpdate(_, prevState) {
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
  render() {
    return (
      <div id="background-div">
        <QueryClientProvider client={queryClient}>
          <RecoilRoot>
            <ReactTooltip effect='solid' />
            <Routes store={this} />
          </RecoilRoot>
        </QueryClientProvider>
      </div>
    )
  }
}

function Routes(props) {
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
