import { useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import {NavBar} from '../general/NavBar'
import api from '../../api/api'
import Footer from '../general/Footer'

function Account(props) {
    let theme = props.store.state.theme
    let default_region = props.store.state.region_selected
    let all_regions = props.store.state.regions

    const [summoner_link, setSummonerLink] = useState({})
    const [region, setRegion] = useState(default_region)
    const [summoner_name, setName] = useState('')
    const [connected_accounts, setConnectedAccounts] = useState([])
    const [is_connected, setIsConnected] = useState(false)
    const [show_error, setShowError] = useState(false)
    const [is_mounted, setIsMounted] = useState(false)

    let getConnectedAccounts = useCallback(() => {
        api.player.getConnectedAccounts().then(response => {
            setConnectedAccounts(response.data.data)
        })
    }, [])

    let handleGenerateCode = useCallback(
        event => {
            let data = {
                action: 'create',
                summoner_name,
                region,
            }
            api.player.generateCode(data).then(response => {
                if (['', undefined, null].indexOf(response.data.uuid) === -1) {
                    setSummonerLink(response.data)
                }
            })
        },
        [region, summoner_name],
    )

    let handleConnect = useCallback(() => {
        let data = {
            summoner_name: summoner_name,
            region: region,
        }
        api.player.connectAccountWithProfileIcon(data).then(response => {
            if (response.data.success === true) {
                setIsConnected(true)
                getConnectedAccounts()
            } else {
                setShowError(true)
            }
        })
    }, [summoner_name, region, getConnectedAccounts])

    let handleNameChange = useCallback(event => {
        setName(event.target.value)
    }, [])

    useEffect(() => {
        if (! is_mounted) {
            getConnectedAccounts()
        }
    }, [getConnectedAccounts, is_mounted])

    useEffect(() => setIsMounted(true), [])

    let connect_attributes = {}
    if (summoner_name.length === 0) {
        connect_attributes.disabled = true
    }
    return (
        <div>
            <NavBar store={props.store} />

            <div>
                <div className="row">
                    <div className="col s10 offset-s1">
                        <div className="row">
                            <div>
                                <h4>Connected Accounts</h4>
                            </div>
                            {connected_accounts.length === 0 && (
                                <div>No accounts connected. Connect your LoL account below.</div>
                            )}
                            {connected_accounts.map(summoner_account => {
                                return (
                                    <div key={`${summoner_account.id}`} className="col l4">
                                        <div className={`card-panel ${theme}`}>
                                            <div>
                                                <span className={`${theme} pill`}>
                                                    {summoner_account.region}
                                                </span>{' '}
                                                <span className={`${theme} pill`}>
                                                    {summoner_account.summoner_level}
                                                </span>{' '}
                                                <span>{summoner_account.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="col l4 m12">
                            <div className={`card-panel ${theme}`}>
                                {!is_connected && (
                                    <>
                                        <div>Connect a LoL Account</div>

                                        <div
                                            style={{ paddingLeft: 15 }}
                                            className={`input-field ${props.store.state.theme}`}
                                        >
                                            <select
                                                ref={elt => {
                                                    window.$(elt).formSelect()
                                                }}
                                                onChange={event => {
                                                    setRegion(event.target.value)
                                                }}
                                                value={region}
                                            >
                                                {all_regions.map((_region, key) => {
                                                    return (
                                                        <option key={key} value={_region}>
                                                            {_region}
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                        <div>
                                            <form
                                                autoComplete="off"
                                                onSubmit={event => event.preventDefault()}
                                            >
                                                <div className="input-field">
                                                    <input
                                                        name="summoner-name"
                                                        autoComplete="off"
                                                        id="summoner-name-connect"
                                                        className={theme}
                                                        type="text"
                                                        value={summoner_name}
                                                        onChange={handleNameChange}
                                                    />
                                                    <label htmlFor="summoner-name-connect">
                                                        <span>Summoner Name</span>
                                                    </label>
                                                </div>
                                            </form>
                                            <button
                                                onClick={handleGenerateCode}
                                                className={`${theme} btn-small`}
                                            >
                                                Generate Code
                                            </button>
                                        </div>

                                        <div>
                                            <div>
                                                {summoner_link.uuid !== undefined && (
                                                    <div>
                                                        <img
                                                            style={{ width: 80 }}
                                                            src={summoner_link.icon.image_url}
                                                            alt=""
                                                        />
                                                    </div>
                                                )}
                                                {summoner_link.uuid === undefined && (
                                                    <span>No Code Generated</span>
                                                )}
                                            </div>

                                            {summoner_link.uuid !== undefined && (
                                                <div
                                                    style={{
                                                        borderStyle: 'solid',
                                                        borderWidth: 1,
                                                        borderRadius: 4,
                                                        borderColor: 'grey',
                                                        padding: 7,
                                                    }}
                                                >
                                                    <div>
                                                        <div>
                                                            Please set your profile icon to the
                                                            image above.
                                                        </div>
                                                    </div>
                                                    <div style={{ paddingTop: 8 }}>
                                                        <span>
                                                            After setting your profile image, click
                                                            connect below. .
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {summoner_link.uuid !== undefined && (
                                            <div>
                                                <button
                                                    {...connect_attributes}
                                                    onClick={handleConnect}
                                                    className={`${theme} btn-small`}
                                                >
                                                    Connect
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                                {is_connected && (
                                    <div>successfully connected summoner account!</div>
                                )}
                                {show_error && (
                                    <div
                                        className="card card-panel red lighten-2"
                                        style={{ color: 'black' }}
                                    >
                                        There was an error while trying to connect your account. Be
                                        sure to set the correct profile icon.
                                        <br />
                                        <button
                                            style={{ marginTop: 4 }}
                                            onClick={() => setShowError(false)}
                                            className={`btn ${theme}`}
                                        >
                                            Close Error
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col s10 offset-s1">
                        <h4>Change Password</h4>
                        <div className="row">
                            <div className="col s12 m12 l4">
                                <div className={`card-panel ${theme}`}>
                                    <ChangePassword store={props.store} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer store={props.store} />
        </div>
    )
}
Account.propTypes = {
    store: PropTypes.object,
}

function ChangePassword(props) {
    let theme = props.store.state.theme

    let [error, setError] = useState('')
    let [old_password, setOldPassword] = useState('')
    let [new_password, setNewPassword] = useState('')
    let [new_password_verify, setNewPasswordVerify] = useState('')

    let sendChange = () => {
        let data = {
            current_password: old_password,
            new_password: new_password,
        }
        api.player
            .changePassword(data)
            .then(response => {
                if (response.data.data === true) {
                    window.location.href = '/login'
                }
            })
            .catch(error => {
                setError(
                    'There was a problem setting your password.  Make sure you typed in your current password correctly.',
                )
            })
    }

    let is_passwords_match = new_password === new_password_verify && new_password.length > 0
    let is_password_min_length = new_password.length >= 7

    let change_pass_attr = {}
    if (!is_passwords_match || old_password.length === 0 || !is_password_min_length) {
        change_pass_attr.disabled = true
    }
    return (
        <div>
            <div className="row">
                {error && <div style={{ color: 'orange' }}>{error}</div>}
                <div className="col s12">
                    <div className="input-field">
                        <input
                            id="old-input"
                            className={theme}
                            type="password"
                            value={old_password}
                            onChange={event => setOldPassword(event.target.value)}
                        />
                        <label htmlFor="old-input">
                            <span>Current Password</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="row" style={{ marginBottom: 0 }}>
                <div className="col s12">
                    Type in your new password. Must be at least 7 characters.
                </div>
            </div>

            <div className="row">
                <div className="col s12">
                    <div className="input-field">
                        <input
                            id="new-password-input"
                            className={theme}
                            type="password"
                            value={new_password}
                            onChange={event => setNewPassword(event.target.value)}
                        />
                        <label htmlFor="new-password-input">
                            <span>New Password</span>
                        </label>
                    </div>

                    <div className="input-field">
                        <input
                            id="retype-new-password-input"
                            className={theme}
                            type="password"
                            value={new_password_verify}
                            onChange={event => setNewPasswordVerify(event.target.value)}
                        />
                        <label htmlFor="retype-new-password-input">
                            <span>Retype New Password</span>
                        </label>
                    </div>
                    {!is_passwords_match && new_password_verify.length > 0 && (
                        <div style={{ marginTop: -20, fontSize: 13, color: 'orange' }}>
                            Passwords don't match
                        </div>
                    )}
                    {new_password_verify.length > 0 && !is_password_min_length && (
                        <div style={{ fontSize: 13, color: 'orange' }}>
                            Password must be at least 7 characters.
                        </div>
                    )}
                </div>
            </div>

            <div className="row" style={{ marginBottom: 0 }}>
                <div className="col s12">
                    <button
                        onClick={sendChange}
                        {...change_pass_attr}
                        className={`${theme} btn-small`}
                    >
                        Change Password
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Account
