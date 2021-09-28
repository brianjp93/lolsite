import {Component, Fragment} from 'react'
import {Link} from 'react-router-dom'
import ReactGA from 'react-ga'
import Orbit from '../general/spinners/orbit'
import PropTypes from 'prop-types'
import {NavBar} from '../general/NavBar'
import MatchCard from './MatchCardHorizontal'
import Spectate from './Spectate'
import SummonerNotFound from './SummonerNotFound'
import ReactTooltip from 'react-tooltip'
import OverviewSelection from './OverviewSelection'
import numeral from 'numeral'
import MatchFilter from './MatchFilter'
import api from '../../api/api'
import Footer from '../general/Footer'
import Modal from 'react-modal'
import MatchCardModal from './MatchCardModal'
import {OftenPlaysWith} from './OftenPlaysWith'

export let MODALSTYLE = {
  overlay: {
    zIndex: 2,
    backgroundColor: '#484848b0',
  },
  content: {
    zIndex: 2,
    // backgroundColor: '#292E49',
    backgroundColor: '#2c2d2f',
    border: 'none',
  },
}

class Summoner extends Component {
  constructor(props) {
    super(props)

    this.state = {
      summoner: {},
      icon: {},
      matches: [],
      comment_counts: {},
      match_ids: new Set(),
      count: 10,
      page: 1,
      next_page: 2,
      last_refresh: null,

      is_requesting_page: false,
      is_requesting_next_page: false,
      is_reloading_matches: false,

      victory_color: '#68b568',
      loss_color: '#c33c3c',
      neutral_color: 'lightblue',
      match_card_height: 400,

      positions: [],

      last_scroll_time: new Date().getTime(),

      is_spectate_modal_open: false,
      is_live_game: false,

      // filtering
      match_filters: {},
    }
    this.getSummonerPage = this.getSummonerPage.bind(this)
    this.getNextPage = this.getNextPage.bind(this)
    this.setQueueDict = this.setQueueDict.bind(this)
    this.getPositions = this.getPositions.bind(this)
    this.setDefaults = this.setDefaults.bind(this)
    this.reloadMatches = this.reloadMatches.bind(this)
    this.getSpectate = this.getSpectate.bind(this)
    this.checkForLiveGame = this.checkForLiveGame.bind(this)
    this.getFilterParams = this.getFilterParams.bind(this)
    this.pagination = this.pagination.bind(this)
    this.getPage = this.getPage.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.getCommentCount = this.getCommentCount.bind(this)
  }
  componentDidMount() {
    ReactGA.event({
      category: 'Summoner Page',
      action: 'Summoner.jsx was mounted.',
    })

    this.getSummonerPage(() => {
      this.getPositions()
      this.checkForLiveGame()
      let now = new Date().getTime()
      this.setState({last_refresh: now})
      this.getCommentCount()
    })
    this.setQueueDict()
  }
  componentDidUpdate(prevProps) {
    // new summoner
    if (
      this.props.route.match.params.summoner_name !== prevProps.route.match.params.summoner_name ||
      this.props.region !== prevProps.region
    ) {
      this.setState({match_filters: {}, page: 1}, () => {
        this.getSummonerPage(() => {
          this.getPositions()
          this.checkForLiveGame()
          let now = new Date().getTime()
          this.setState({last_refresh: now})
          this.getCommentCount()
        })
      })
    }
  }
  setDefaults(callback) {
    var defaults = {
      summoner: {},
      icon: {},
      matches: [],
      match_ids: new Set(),
      next_page: 2,
      page: 1,
      is_requesting_page: false,
      is_requesting_next_page: false,

      victory_color: '#68b568',
      loss_color: '#c33c3c',
      neutral_color: 'lightblue',
      is_spectate_modal_open: false,

      positions: [],
    }
    this.setState(defaults, () => {
      if (typeof callback === 'function') {
        callback()
      }
    })
  }
  getCommentCount() {
    let data = {match_ids: this.state.matches.map((x) => x.id)}
    api.player
      .getCommentCount(data)
      .then((response) => this.setState({comment_counts: response.data.data}))
  }
  getFilterParams() {
    let params = this.props.route.match.params
    let filters = this.state.match_filters
    let data = {
      summoner_name: params.summoner_name ? params.summoner_name : null,
      id: params.id ? params.id : null,
      region: this.props.region,
      count: this.state.count,
      queue: filters.queue_filter,
      with_names: filters.summoner_filter !== undefined ? filters.summoner_filter.split(',') : '',
      champion_key: filters.champion,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }
    return data
  }
  getSummonerPage(callback) {
    if (!this.state.is_reloading_matches) {
      this.setState({is_requesting_page: true})
    }

    let data = this.getFilterParams()
    data.update = true

    api.player
      .getSummonerPage(data)
      .then((response) => {
        this.setState(
          {
            summoner: response.data.summoner,
            region: this.props.region,
            icon: response.data.profile_icon,
            matches: response.data.matches,
            match_ids: new Set(response.data.matches.map((x) => x.id)),
            positions: response.data.positions,
          },
          () => {
            if (callback !== undefined) {
              callback()
            }
          },
        )
      })
      .catch((error) => {
        console.log(error)
        // window.alert('No summoner with that name was found.')
        this.setState({summoner: false})
      })
      .then(() => {
        this.setState({
          is_requesting_page: false,
          is_reloading_matches: false,
        })
      })
  }
  reloadMatches(callback, {force = false}) {
    this.setState(
      {
        match_ids: new Set(),
        next_page: 2,
        page: 1,
        is_reloading_matches: true,
      },
      () => {
        if (force) {
          this.getSummonerPage(() => {
            this.getPositions()
            this.setState({last_refresh: new Date().getTime()})
            this.getCommentCount()
            if (typeof callback === 'function') {
              try {
                callback()
              } catch (error) {
                console.log('Caught error in reloadMatches method in Summoner.jsx.')
                console.error(error)
              }
            }
          })
        } else {
          this.getSummonerPage(() => {
            this.getPositions()
            this.setState({last_refresh: new Date().getTime()})
            this.getCommentCount()
            if (typeof callback === 'function') {
              try {
                callback()
              } catch (error) {
                console.log('Caught error in reloadMatches method in Summoner.jsx.')
                console.error(error)
              }
            }
          })
          this.setState({is_reloading_matches: false})
        }
      },
    )
  }
  getNextPage() {
    this.setState({is_requesting_next_page: true})

    let data = this.getFilterParams()
    data.update = false
    data.trigger_import = true
    data.after_index = this.state.matches.length
    data.page = this.state.next_page

    api.player.getSummonerPage(data).then((response) => {
      var new_matches = []
      var new_match_ids = this.state.match_ids
      for (var m of response.data.matches) {
        if (new_match_ids.has(m.id)) {
          // ignore
        } else {
          new_match_ids.add(m.id)
          new_matches.push(m)
        }
      }
      this.setState({
        summoner: response.data.summoner,
        region: this.props.region,
        icon: response.data.profile_icon,
        matches: [...this.state.matches, ...new_matches],
        next_page: this.state.next_page + 1,
        is_requesting_next_page: false,
      })
    })
  }
  getPage() {
    this.setState({is_requesting_next_page: true})

    let data = this.getFilterParams()
    data.update = false
    data.trigger_import = true
    data.page = this.state.page

    api.player
      .getSummonerPage(data)
      .then((response) => {
        this.setState(
          {
            summoner: response.data.summoner,
            region: this.props.region,
            icon: response.data.profile_icon,
            matches: response.data.matches,
            is_requesting_next_page: false,
          },
          this.getCommentCount,
        )
      })
      .catch((_) => {})
  }
  pagination() {
    const theme = this.props.store.state.theme
    let disabled = {disabled: false}
    if (this.state.is_requesting_next_page) {
      disabled.disabled = true
    }
    return (
      <div>
        <button
          {...disabled}
          onClick={() => {
            let page = this.state.page
            page = page - 1
            if (page >= 1) {
              this.setState({page}, this.getPage)
            }
          }}
          className={`${theme} btn-small`}
        >
          <i className="material-icons">chevron_left</i>
        </button>
        <button
          {...disabled}
          style={{marginLeft: 8}}
          onClick={() => {
            let page = this.state.page
            page = page + 1
            this.setState({page}, this.getPage)
          }}
          className={`${theme} btn-small`}
        >
          <i className="material-icons">chevron_right</i>
        </button>
        <div style={{display: 'inline-block', marginLeft: 8}}>{this.state.page}</div>
      </div>
    )
  }
  getSpectate() {
    var data = {
      region: this.props.region,
      summoner_id: this.state.summoner._id,
    }
    api.match
      .getSpectate(data)
      .then((response) => {
        this.setState({spectate: response.data})
      })
      .catch((error) => {
        console.log(error)
      })
  }
  checkForLiveGame() {
    var data = {
      region: this.props.region,
      summoner_id: this.state.summoner._id,
    }
    api.match
      .checkForLiveGame(data)
      .then((_) => {
        this.setState({is_live_game: true})
      })
      .catch((error) => {
        if (error.response !== undefined) {
          if (error.response.status === 404) {
            this.setState({is_live_game: false})
          }
        }
      })
  }
  getPositions() {
    var data = {
      summoner_id: this.state.summoner._id,
      region: this.props.region,
    }
    api.player
      .getPositions(data)
      .then((response) => this.setState({positions: response.data.data}))
      .catch((_) => {})
  }
  setQueueDict() {
    var queue_elt = document.getElementById('queues')
    var queues = JSON.parse(queue_elt.innerHTML)
    var qdict = {}
    for (var q of queues) {
      q.description = q.description.replace('games', '').trim()
      qdict[q._id] = q
    }
    this.setState({queues: qdict})
  }
  closeModal() {
    let pathname = window.location.pathname.split(/match\/\d+/)[0]
    this.props.route.history.push(pathname)
  }
  render() {
    const custom_max_width = 'col l10 offset-l1 m12 s12'
    const store = this.props.store
    const theme = store.state.theme
    const match_id = this.props.route.match.params.match_id
    let is_match_modal_open = false
    if (match_id !== undefined) {
      is_match_modal_open = true
    }
    return (
      <div>
        <div style={{minHeight: 1000}}>
          <NavBar store={this.props.store} region={this.props.region} />
          {this.state.is_requesting_page && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 100,
                }}
              >
                <Orbit size={300} style={{margin: 'auto'}} />
              </div>
            </div>
          )}

          {!this.state.is_requesting_page && this.state.summoner === false && (
            <SummonerNotFound store={this.props.store} />
          )}

          {!this.state.is_requesting_page && this.state.summoner !== false && (
            <div>
              {this.state.matches.length > 0 && (
                <Modal
                  isOpen={is_match_modal_open}
                  onRequestClose={this.closeModal}
                  style={MODALSTYLE}
                >
                  <MatchCardModal
                    closeModal={this.closeModal}
                    pageStore={this}
                    summoner={this.state.summoner}
                    region={this.props.region}
                    store={store}
                    route={this.props.route}
                  />
                </Modal>
              )}
              <div className="row" style={{marginBottom: 0}}>
                <div className="col l10 offset-l1">
                  <div
                    style={{
                      width: 400,
                      display: 'inline-block',
                      marginRight: 15,
                    }}
                  >
                    {this.state.summoner.name !== undefined && (
                      <SummonerCard
                        last_refresh={this.state.last_refresh}
                        positions={this.state.positions}
                        icon={this.state.icon}
                        summoner={this.state.summoner}
                        store={this.props.store}
                        pageStore={this}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'top',
                    }}
                  >
                    <div
                      style={{
                        minWidth: 750,
                        padding: 15,
                      }}
                      className={`${theme} card-panel`}
                    >
                      <OverviewSelection
                        store={store}
                        parent={this}
                        summoner={this.state.summoner}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className={`${custom_max_width}`}>
                  <div className="row">
                    <div className="col l6 m12">
                      <MatchFilter store={store} parent={this} />
                    </div>
                    <div className="col l6 m12">
                      <div
                        style={{
                          display: 'inline-block',
                          verticalAlign: 'top',
                        }}
                      >
                        <RecentlyPlayedWith
                          matches={this.state.matches}
                          store={this.props.store}
                          pageStore={this}
                          summoner={this.state.summoner}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{visibility: 'visibile'}}>
                <div className="col l10 offset-l1 m12 s12">
                  <div style={{display: 'inline-block'}}>
                    {this.pagination()}
                    {this.state.is_requesting_next_page && (
                      <div style={{width: 600}}>
                        <Orbit
                          size={200}
                          style={{
                            margin: 'auto',
                          }}
                        />
                      </div>
                    )}
                    {!this.state.is_requesting_next_page &&
                      this.state.matches.map((match, key) => {
                        return (
                          <MatchCard
                            key={`${key}-${match._id}`}
                            index={key}
                            store={this.props.store}
                            pageStore={this}
                            match={match}
                            comment_count={this.state.comment_counts[match.id]}
                          />
                        )
                      })}
                    {this.pagination()}
                  </div>

                  {this.state.summoner && (
                    <div
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'top',
                        marginLeft: 8,
                      }}
                    >
                      <h5 style={{marginBottom: 3}}>Often Plays With</h5>
                      <OftenPlaysWith
                        region={this.props.region}
                        store={this.props.store}
                        summoner_id={this.state.summoner.id}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer store={this.props.store} />
      </div>
    )
  }
}

class SummonerCard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      has_been_set: false,
    }

    this.positionalRankImage = this.positionalRankImage.bind(this)
    this.generalRankImage = this.generalRankImage.bind(this)
    this.soloPositions = this.soloPositions.bind(this)
    this.miniSeries = this.miniSeries.bind(this)
    this.setRefreshTime = this.setRefreshTime.bind(this)
    this.toggleFavorite = this.toggleFavorite.bind(this)
    this.isFavorite = this.isFavorite.bind(this)
    this.toggleDefault = this.toggleDefault.bind(this)
  }
  componentDidMount() {
    this.setRefreshTime()
    this.refresh_timer = setInterval(this.setRefreshTime, 60000)
  }
  componentWillUnmount() {
    clearInterval(this.refresh_timer)
  }
  componentDidUpdate(prevProps) {
    if (!this.state.has_been_set) {
      this.setRefreshTime()
    } else if (this.props.last_refresh !== prevProps.last_refresh) {
      this.setRefreshTime()
    }
  }
  positionalRankImage(position, tier) {
    position = position.toLowerCase()
    tier = tier.toLowerCase()

    var pos_convert = {
      top: 'Top',
      bottom: 'Bot',
      middle: 'Mid',
      jungle: 'Jungle',
      utility: 'Support',
      support: 'Support',
    }
    position = pos_convert[position]

    var tier_convert = {
      iron: 'Iron',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Plat',
      diamond: 'Diamond',
      master: 'Master',
      grandmaster: 'Grandmaster',
      challenger: 'Challenger',
    }
    tier = tier_convert[tier]

    return `${this.props.store.state.static}ranked-emblems/positions/Position_${tier}-${position}.png`
  }
  generalRankImage(tier) {
    tier = tier.toLowerCase()
    var tier_convert = {
      iron: 'Iron',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
      diamond: 'Diamond',
      master: 'Master',
      grandmaster: 'Grandmaster',
      challenger: 'Challenger',
    }
    tier = tier_convert[tier]

    return `${this.props.store.state.static}ranked-emblems/emblems/Emblem_${tier}.png`
  }
  soloPositions() {
    let pos = []
    for (let p of this.props.positions) {
      if (p.position !== 'NONE') {
        pos.push(p)
      }
    }
    return pos
  }
  setRefreshTime() {
    let now = new Date().getTime()
    var last_refresh = this.props.pageStore.state.last_refresh
    if (last_refresh !== null) {
      var diff = Math.round((now - last_refresh) / 1000)
      var minutes = Math.floor(diff / 60)
      if (minutes > 0) {
        if (minutes === 1) {
          this.refresh_time.innerHTML = `a minute ago`
        } else if (minutes > 99) {
          this.refresh_time.innerHTML = 'a long time ago'
        } else {
          this.refresh_time.innerHTML = `${minutes} minutes ago`
        }
      } else {
        this.refresh_time.innerHTML = 'a moment ago'
      }
      if (!this.state.has_been_set) {
        this.setState({has_been_set: true})
      }
    }
  }
  miniSeries(progress) {
    var letters = []
    for (var l of progress) {
      letters.push(l)
    }
    return letters.map((letter, key) => {
      var shared_styles = {
        margin: '0 2px',
        display: 'inline-block',
        height: 14,
        width: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'grey',
      }
      if (letter === 'W') {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: this.props.pageStore.state.victory_color,
            }}
          ></div>
        )
      } else if (letter === 'L') {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: this.props.pageStore.state.loss_color,
            }}
          ></div>
        )
      } else {
        return (
          <div
            key={key}
            style={{
              ...shared_styles,
              background: 'grey',
            }}
          ></div>
        )
      }
    })
  }
  queueName(queue) {
    var out = queue
    var convert = {
      RANKED_SOLO_5x5: 'Solo/Duo',
      RANKED_FLEX_SR: '5v5 Flex',
      RANKED_FLEX_TT: '3v3 Flex',
      RANKED_TFT: 'TFT',
    }
    if (convert[queue] !== undefined) {
      out = convert[queue]
    }
    return out
  }
  getWinRate(wins, losses) {
    var rate = wins / (wins + losses)
    return rate * 100
  }
  toggleFavorite() {
    let data = {
      summoner_id: this.props.summoner.id,
    }
    if (this.isFavorite()) {
      data.verb = 'remove'
    } else {
      data.verb = 'set'
    }
    api.player.Favorite(data).then((response) => {
      this.props.store.setState({favorites: response.data.data})
    })
  }
  isFavorite() {
    let summoner_id = this.props.summoner.id
    for (let favorite of this.props.store.state.favorites) {
      if (favorite.summoner === summoner_id) {
        return true
      }
    }
    return false
  }
  toggleDefault() {
    let data = {summoner_id: null}
    let keys = Object.keys(this.props.store.state.user.default_summoner)
    if (keys.length === 0) {
      data = {summoner_id: this.props.summoner.id}
    }
    api.player.editDefaultSummoner(data).then((response) => {
      if (response.data.status === 'success') {
        let user = {...this.props.store.state.user}
        user.default_summoner = response.data.default_summoner
        this.props.store.setState({user: user})
      }
    })
  }
  render() {
    var reload_attrs = {
      disabled: this.props.pageStore.state.is_reloading_matches ? true : false,
    }
    let pageStore = this.props.pageStore
    let theme = this.props.store.state.theme
    let store = this.props.store
    return (
      <span>
        <div style={{position: 'relative', padding: 18}} className={`card-panel ${theme}`}>
          {this.props.icon.image_url !== undefined && (
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              <img
                style={{
                  height: 50,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  borderRadius: 5,
                }}
                src={this.props.icon.image_url}
                alt={`profile icon ${this.props.icon._id}`}
              />
              <span
                style={{
                  display: 'inline-block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  fontSize: 'smaller',
                  width: 50,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 'inherit',
                    height: 'inherit',
                    textAlign: 'center',
                    marginTop: 43,
                  }}
                >
                  <span
                    style={{
                      fontWeght: 'bold',
                      display: 'inline-block',
                      width: 40,
                      borderRadius: 4,
                      color: 'black',
                      background: 'white',
                      padding: '0 2px',
                    }}
                  >
                    {this.props.summoner.summoner_level}
                  </span>
                </span>
              </span>
            </span>
          )}

          <div
            style={{
              display: 'inline-block',
              width: 300,
              maxWidth: '87%',
              textAlign: 'center',
              verticalAlign: 'middle',
              height: 25,
            }}
          >
            <span
              style={{
                textDecoration: 'underline',
                fontWeight: 'bold',
              }}
            >
              {this.props.summoner.name}
            </span>
            <br />
            <Spectate.SpectateModal
              queue_convert={store.state.queue_convert}
              theme={theme}
              summoner_id={this.props.summoner._id}
              pageStore={this.props.pageStore}
            >
              <small>
                {this.props.pageStore.state.is_live_game ? 'Live Game!' : 'Check For Game'}
              </small>
            </Spectate.SpectateModal>
          </div>

          <span style={{position: 'absolute', right: 2, top: 2}}>
            <small
              className="unselectable"
              style={{
                display: 'inline-block',
                verticalAlign: 'top',
                marginRight: 3,
                borderStyle: 'solid',
                borderWidth: 1,
                padding: 2,
                borderRadius: 3,
                borderColor: '#ffffff40',
                color: '#ffffff70',
                marginTop: 3,
              }}
            >
              {pageStore.last_refresh !== null && <span>Last Refresh: </span>}
              <span
                ref={(elt) => {
                  this.refresh_time = elt
                }}
                style={{fontWeight: 'bold'}}
              ></span>
            </small>
            <button
              {...reload_attrs}
              className="dark btn-small"
              onClick={() => this.props.pageStore.reloadMatches(null, {force: true})}
            >
              <i className="material-icons">autorenew</i>
            </button>
          </span>

          {store.state.user.email !== undefined && (
            <Fragment>
              <ReactTooltip effect="solid" id="favorite-button">
                <span>{this.isFavorite() ? 'Remove favorite' : 'Set favorite'}</span>
              </ReactTooltip>
              <span
                style={{
                  position: 'absolute',
                  right: 2,
                  top: 38,
                }}
              >
                <button
                  data-tip
                  data-for="favorite-button"
                  className="dark btn-small"
                  onClick={this.toggleFavorite}
                >
                  <i className="material-icons">
                    {this.isFavorite() ? 'favorite' : 'favorite_border'}
                  </i>
                </button>
              </span>
            </Fragment>
          )}

          {this.soloPositions().length > 0 && <hr />}

          <div style={{paddingTop: 10}}>
            {this.props.positions.map((pos) => {
              if (pos.queue_type === 'RANKED_SOLO_5x5') {
                var gen_positions = ['NONE', 'APEX']
                return (
                  <div key={`${pos.position}-${this.props.summoner._id}`}>
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          width: 50,
                        }}
                      >
                        {gen_positions.indexOf(pos.position) === -1 && (
                          <img
                            src={this.positionalRankImage(pos.position, pos.tier)}
                            style={{height: 40}}
                            alt=""
                          />
                        )}
                        {gen_positions.indexOf(pos.position) >= 0 && (
                          <img src={this.generalRankImage(pos.tier)} style={{height: 40}} alt="" />
                        )}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          lineHeight: 1,
                          verticalAlign: 'super',
                        }}
                      >
                        <span>
                          {pos.tier} {pos.rank}
                        </span>
                        <br />
                        <small>
                          <span
                            style={{
                              fontWeight: 'bold',
                            }}
                          >{`${numeral(this.getWinRate(pos.wins, pos.losses)).format(
                            '0.0',
                          )}%`}</span>{' '}
                          - {pos.wins}W / {pos.losses}L
                        </small>
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'absolute',
                          right: 18,
                        }}
                      >
                        <small className={`${theme} pill`}>{this.queueName(pos.queue_type)}</small>{' '}
                        <span className={`${theme} pill`}>{pos.league_points} LP</span>
                        {pos.series_progress && (
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            {this.miniSeries(pos.series_progress)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
            {this.props.positions.map((pos) => {
              if (pos.queue_type !== 'RANKED_SOLO_5x5') {
                return (
                  <div key={`${pos.position}-${pos.queue_type}-${this.props.summoner._id}`}>
                    <hr />
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          width: 50,
                        }}
                      >
                        <img src={this.generalRankImage(pos.tier)} style={{height: 40}} alt="" />
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          lineHeight: 1,
                          verticalAlign: 'super',
                        }}
                      >
                        <span>
                          {pos.tier} {pos.rank}
                        </span>
                        <br />
                        <small>
                          <span
                            style={{
                              fontWeight: 'bold',
                            }}
                          >{`${numeral(this.getWinRate(pos.wins, pos.losses)).format(
                            '0.0',
                          )}%`}</span>{' '}
                          - {pos.wins}W / {pos.losses}L
                        </small>
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          position: 'absolute',
                          right: 18,
                        }}
                      >
                        <small className={`${theme} pill`}>{this.queueName(pos.queue_type)}</small>{' '}
                        <span className={`${theme} pill`}>{pos.league_points} LP</span>
                        {pos.series_progress && (
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            {this.miniSeries(pos.series_progress)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>

          {store.state.user.email !== undefined && (
            <div>
              <button
                onClick={this.toggleDefault}
                style={{width: '100%'}}
                className={`${theme} btn-small`}
              >
                {store.state.user.default_summoner.id === pageStore.state.summoner.id && (
                  <Fragment>Remove as Default Profile</Fragment>
                )}
                {store.state.user.default_summoner.id !== pageStore.state.summoner.id && (
                  <Fragment>Set as Default Profile</Fragment>
                )}
              </button>
            </div>
          )}
        </div>
      </span>
    )
  }
}
SummonerCard.propTypes = {
  store: PropTypes.any,
  pageStore: PropTypes.any,
  last_refresh: PropTypes.any,
}

class RecentlyPlayedWith extends Component {
  constructor(props) {
    super(props)
    this.state = {}

    this.countPlayers = this.countPlayers.bind(this)
    this.sortPlayers = this.sortPlayers.bind(this)
  }
  countPlayers() {
    var count = {}
    for (var match of this.props.matches) {
      for (var p of match.participants) {
        if (p.puuid === this.props.summoner.puuid) {
          // ignore self
        } else if ([0, '0'].indexOf(p.puuid) >= 0) {
          // ignore bots
        } else {
          if (count[p.summoner_name] === undefined) {
            count[p.summoner_name] = 1
          } else {
            count[p.summoner_name] += 1
          }
        }
      }
    }
    return count
  }
  sortPlayers() {
    var count_dict = this.countPlayers()
    var count_list = []
    for (var name in count_dict) {
      // only add to list if count > 1
      if (count_dict[name] > 1) {
        count_list.push({
          summoner_name: name,
          count: count_dict[name],
        })
      }
    }
    count_list.sort((a, b) => {
      return b.count - a.count
    })
    return count_list
  }
  render() {
    return (
      <div
        style={{
          width: 270,
          height: 150,
          marginLeft: 15,
          padding: 15,
        }}
        className={`card-panel ${this.props.store.state.theme}`}
      >
        <div
          style={{
            textDecoration: 'underline',
            display: 'inline-block',
          }}
        >
          Players In These Games
        </div>{' '}
        <small>{this.props.matches.length} games</small>
        <br />
        <div className="quiet-scroll" style={{overflowY: 'scroll', maxHeight: '85%'}}>
          <table>
            {this.sortPlayers().map((data) => {
              var td_style = {padding: '3px 5px'}
              return (
                <tbody key={`row-for-${data.summoner_name}`} style={{fontSize: 'small'}}>
                  <tr>
                    <td style={td_style}>
                      <Link
                        target="_blank"
                        className={`${this.props.store.state.theme}`}
                        to={`/${this.props.pageStore.props.region}/${data.summoner_name}/`}
                      >
                        {data.summoner_name}
                      </Link>
                    </td>
                    <td style={td_style}>{data.count}</td>
                  </tr>
                </tbody>
              )
            })}
          </table>
        </div>
      </div>
    )
  }
}
RecentlyPlayedWith.propTypes = {
  store: PropTypes.object,
  pageStore: PropTypes.object,
  summoner: PropTypes.object,
  matches: PropTypes.array,
}

export default Summoner
