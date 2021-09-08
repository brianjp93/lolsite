import {useState, useEffect, useMemo, useRef, useCallback} from 'react'
import { useDebounce } from '../../hooks'
import {Link, useHistory} from 'react-router-dom'
import {NotificationBell} from '../notification/notificationbell'
import api from '../../api/api'

interface Win extends Window {
  $: any
}
declare let window: Win

export function NavBar(props: any) {
  const [summonerName, setSummonerName] = useState('')
  const debouncedSummonerName = useDebounce(summonerName, 300)
  const [summonerSearch, setSummonerSearch] = useState<Record<string, string>[]>([])
  const [isQuicksearchOpen, setIsQuickSearchOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(0)
  const [isShowUserDropdown, setIsShowUserDropdown] = useState(false)
  const history = useHistory()

  const input = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const user = props.store.state.user
  const theme = props.store.state.theme
  const ignore_hotkeys = useMemo(() => props.ignore_hotkeys || [], [props.ignore_hotkeys])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        let name = summonerName
        if (highlightIndex !== null && highlightIndex >= 0) {
          try {
            name = summonerSearch[highlightIndex]?.name
          } catch (error) {
            name = summonerName
          }
        }
        if (name.length > 0) {
          event.preventDefault()
          event.stopPropagation()
          setSummonerName(name)
          setIsQuickSearchOpen(false)
          history.push(`/${props.store.state.region_selected}/${name}/`)
        }
      } else if (['ArrowUp', 'ArrowDown', 'Tab'].indexOf(event.key) >= 0) {
        event.preventDefault()
        event.stopPropagation()
        let index = highlightIndex || 0
        let top_index = summonerSearch.length - 1
        if (highlightIndex === null) {
          if (event.key === 'ArrowUp') {
            index = top_index
          } else if (event.key === 'ArrowDown' || event.key === 'Tab') {
            index = 0
          }
        } else {
          if (event.key === 'ArrowUp') {
            index--
            if (index < 0) {
              index = top_index
            }
          } else if (event.key === 'ArrowDown' || event.key === 'Tab') {
            index++
            if (index > top_index) {
              index = 0
            }
          }
        }
        setHighlightIndex(index)
      }
      return event
    },
    [highlightIndex, summonerName, summonerSearch, history, props.store.state.region_selected],
  )

  const handleKeyListener = useCallback((event: KeyboardEvent) => {
    if (ignore_hotkeys.indexOf(event.key.toLowerCase()) >= 0) {
      return
    } else {
      const target = event.target as HTMLElement
      if (props.store.state.ignore_tags.has(target.tagName.toLowerCase())) {
        if (['escape'].indexOf(event.key.toLowerCase()) >= 0) {
          target.blur();
          event.preventDefault()
          event.stopPropagation()
        }
      } else {
        if (['/', 's'].indexOf(event.key.toLowerCase()) >= 0) {
          input.current?.focus()
          input.current?.select()
          event.preventDefault()
          event.stopPropagation()
        }
      }
    }
  }, [ignore_hotkeys, props.store.state.ignore_tags])

  const handleSearchOutsideClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (searchRef.current && !searchRef.current.contains(target)) {
      setIsQuickSearchOpen(false)
    }
  }, [searchRef])

  const handleUserDropdownOutsideClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!userDropdownRef.current?.contains(target)) {
      setIsShowUserDropdown(false)
    }
  }, [userDropdownRef])

  const isLoggedIn = useMemo(() => {
    return user.email !== undefined
  }, [user])

  const simplifyName = (name: string) => {
    return name.split(' ').join('').toLowerCase()
  }

  const doSearch = useCallback(() => {
    if (debouncedSummonerName.length >= 3) {
      let region = props.store.state.region_selected
      const name = simplifyName(debouncedSummonerName)
      let data = {
        simple_name__icontains: name,
        region: region,
        order_by: 'simple_name',
        start: 0,
        end: 10,
        fields: ['name', 'summoner_level'],
      }
      api.player.summonerSearch(data).then((response) => {
        if (name === simplifyName(debouncedSummonerName)) {
          setSummonerSearch(response.data.data)
        }
      })
    } else {
      setSummonerSearch([])
    }
  }, [debouncedSummonerName, props.store.state.region_selected])

  const quickSearchLine = useCallback(
    (data: any, key: number) => {
      let {name, summoner_level} = data
      let highlightStyle: React.CSSProperties = {}
      if (key === highlightIndex) {
        highlightStyle.backgroundColor = '#ffffff20'
      }
      return (
        <div
          onClick={() => {
            setSummonerName(name)
            setIsQuickSearchOpen(false)
          }}
          style={{
            padding: '0 10px',
            cursor: 'pointer',
            ...highlightStyle,
          }}
          className="hover-lighten"
          key={`${name}-${key}`}
        >
          <div
            style={{
              display: 'inline-block',
              width: 50,
            }}
          >
            <span
              style={{
                borderStyle: 'solid',
                borderWidth: 1,
                borderColor: 'grey',
                borderRadius: 4,
                fontSize: 'smaller',
                padding: '2px 5px',
              }}
            >
              {summoner_level > 0 && <span>{summoner_level}</span>}
              {summoner_level === 0 && <span>##</span>}
            </span>
          </div>
          <div style={{display: 'inline-block'}}>{name}</div>
        </div>
      )
    },
    [highlightIndex],
  )

  useEffect(() => {
    window.$('.sidenav').sidenav()
    window.$('.dropdown-trigger').dropdown()

    window.addEventListener('keydown', handleKeyListener)
    window.addEventListener('mousedown', handleSearchOutsideClick)
    window.addEventListener('mousedown', handleUserDropdownOutsideClick)
    return () => {
      window.removeEventListener('keydown', handleKeyListener)
      window.removeEventListener('mousedown', handleSearchOutsideClick)
      window.removeEventListener('mousedown', handleUserDropdownOutsideClick)
    }
  }, [handleKeyListener, handleUserDropdownOutsideClick, handleSearchOutsideClick])

    useEffect(() => {
      doSearch()
    }, [doSearch])

  return (
    <span>
      <ul id="dropdown1" className="dropdown-content">
        <li>
          <a href="#!">one</a>
        </li>
      </ul>
      <nav className={`${theme}`}>
        <div className="nav-wrapper">
          <Link to="/" className="left" style={{marginLeft: 10, padding: '0px 15px'}}>
            <img
              title="Welcome to the hardstuck club."
              className="logo-glow"
              style={{maxHeight: '100%', verticalAlign: 'middle', marginRight: 10}}
              src={`${props.store.state.static}logo-clean.png`}
              alt="HardStuck Club"
            />
          </Link>
          <form
            onSubmit={(event) => {
              event.preventDefault()
            }}
            style={{
              display: 'inline-block',
              width: 350,
              background: '#ffffff20',
            }}
          >
            <div
              style={{
                width: 60,
                display: 'inline-block',
                paddingLeft: 15,
              }}
              className={`input-field ${props.store.state.theme}`}
            >
              <select
                ref={(elt) => {
                  window.$(elt).formSelect()
                }}
                onChange={(event) => {
                  props.store.setState({region_selected: event.target.value}, doSearch)
                }}
                value={props.store.state.region_selected}
              >
                {props.store.state.regions.map((_region: string, key: number) => {
                  return (
                    <option key={key} value={_region}>
                      {_region}
                    </option>
                  )
                })}
              </select>
            </div>

            <div
              style={{
                display: 'inline-block',
                width: 280,
                position: 'relative',
              }}
              className="input-field"
            >
              <input
                autoComplete="off"
                ref={input}
                style={{color: '#929292'}}
                value={summonerName}
                onChange={(event) => {
                  setSummonerName(event.target.value)
                  setHighlightIndex(null)
                }}
                onFocus={() => setIsQuickSearchOpen(true)}
                onKeyDown={handleKeyDown}
                id="summoner_search"
                type="search"
              />
              <label className="label-icon" htmlFor="summoner_search">
                <i className="material-icons">search</i>
              </label>
              <i className="material-icons">close</i>
              {isQuicksearchOpen && (
                <div
                  ref={searchRef}
                  className={`${theme} card-panel`}
                  style={{
                    position: 'absolute',
                    width: 350,
                    top: 60,
                    left: -60,
                    zIndex: 11,
                    padding: 0,
                  }}
                >
                  <div style={{textAlign: 'center'}}>
                    <button
                      onClick={() => setIsQuickSearchOpen(false)}
                      className={`${theme} btn-small`}
                      style={{width: '90%', textAlign: 'center'}}
                    >
                      close
                    </button>
                  </div>
                  {summonerSearch.length === 0 && (
                    <div
                      style={{padding: '10px 10px', lineHeight: '30px'}}
                      className="error-bordered"
                    >
                      No matches.
                      <br />
                      Please provide at least 3 characters.
                    </div>
                  )}
                  {summonerSearch.map((data, key) => {
                    return quickSearchLine(data, key)
                  })}
                </div>
              )}
            </div>
          </form>

          <div style={{display: 'contents'}} className="hide-on-med-and-down">
            <div style={{display: 'inline-block', marginLeft: 15}}>
              <Link to="/item/">Items</Link>
            </div>
            <div style={{display: 'inline-block', marginLeft: 15}}>
              <Link to="/item/stats/">Stats</Link>
            </div>
            <div style={{display: 'inline-block', marginLeft: 15}}>
              <Link to="/champion/">Champion</Link>
            </div>
            {isLoggedIn && (
              <div
                style={{
                  display: 'flex',
                  marginRight: 15,
                  position: 'relative',
                }}
                className="right"
              >
                <div style={{display: 'flex'}}>
                  <NotificationBell theme={theme} />
                </div>

                <div
                  onClick={() => setIsShowUserDropdown((state) => !state)}
                  style={{
                    cursor: 'pointer',
                    marginLeft: 15,
                    display: 'flex',
                  }}
                >
                  {user.email}{' '}
                  {isShowUserDropdown && (
                    <i
                      style={{
                        display: 'inline',
                        verticalAlign: 'bottom',
                      }}
                      className="material-icons"
                    >
                      arrow_drop_up
                    </i>
                  )}
                  {!isShowUserDropdown && (
                    <i
                      style={{
                        display: 'inline',
                        verticalAlign: 'bottom',
                      }}
                      className="material-icons"
                    >
                      arrow_drop_down
                    </i>
                  )}
                </div>

                {isShowUserDropdown && (
                  <div
                    ref={userDropdownRef}
                    id="user-dropdown"
                    className={`${theme} card-panel`}
                    style={{
                      position: 'absolute',
                      top: 50,
                      right: 0,
                      width: 300,
                      margin: 0,
                      padding: '5px 10px',
                      zIndex: 10,
                    }}
                  >
                    <div style={{height: 10}}></div>

                    <div>
                      <Link to="/account">
                        <div style={{width: '100%'}}>My Account</div>
                      </Link>
                    </div>

                    {props.store.state.favorites.map((favorite: any) => {
                      return (
                        <div
                          style={{
                            margin: '0 0 10px 0',
                            lineHeight: 1.5,
                          }}
                          className="row"
                        >
                          <div style={{height: 30}} className="col s12">
                            <Link
                              onClick={() => setIsShowUserDropdown(true)}
                              to={`/${favorite.region}/${favorite.name}/`}
                              style={{marginRight: 15}}
                            >
                              <div style={{width: '100%'}}>
                                <div
                                  style={{
                                    display: 'inline-block',
                                    padding: 5,
                                    borderRadius: 3,
                                    color: 'grey',
                                    borderColor: 'grey',
                                    borderStyle: 'solid',
                                    borderWidth: 1,
                                    fontSize: 'small',
                                  }}
                                >
                                  {favorite.region}
                                </div>{' '}
                                {favorite.name}
                              </div>
                            </Link>
                          </div>
                        </div>
                      )
                    })}

                    <a style={{width: '100%'}} href="/logout">
                      Logout
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          {!isLoggedIn && (
            <Link className="right" to="/login" style={{marginRight: 15}}>
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>
    </span>
  )
}
