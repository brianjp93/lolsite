import { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'


export class RecentlyPlayedWith extends Component {
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
                        to={`/${this.props.region}/${data.summoner_name}/`}
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
  summoner: PropTypes.object,
  matches: PropTypes.array,
  region: PropTypes.string,
}
