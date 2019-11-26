import React, {useState, useCallback, useEffect} from 'react'
import PropTypes from 'prop-types'
import NavBar from '../general/NavBar'
import api from '../../api/api'
import Footer from '../general/Footer'


function Account(props) {
    let theme = props.store.state.theme
    let region = props.store.state.region_selected

    let [uuid, setUuid] = useState('')
    let [summoner_name, setName] = useState('')
    let [connected_accounts, setConnectedAccounts] = useState([])

    let getUuid = useCallback(() => {
        let data = {'action': 'get'}
        api.player.generateCode(data)
            .then(response => {
                if (['', undefined, null].indexOf(response.data.uuid) === -1) {
                    setUuid(response.data.uuid)
                }
            })
    }, [])

    let getConnectedAccounts = useCallback(() => {
        api.player.getConnectedAccounts()
            .then(response => {
                setConnectedAccounts(response.data.data)
            })
    }, [])

    let handleGenerateCode = useCallback((event) => {
        
        let data = {'action': 'create'}
        api.player.generateCode(data)
            .then(response => {
                if (['', undefined, null].indexOf(response.data.uuid) === -1) {
                    setUuid(response.data.uuid)
                }
            })
    }, [])

    let handleConnect = useCallback((event) => {
        let data = {
            summoner_name: summoner_name,
            region: region,
        }
        api.player.connectAccount(data)
            .then(response => {
                
            })
    }, [summoner_name, region])

    let handleNameChange = useCallback((event) => {
        setName(event.target.value)
    }, [])

    useEffect(getUuid, [theme])
    useEffect(getConnectedAccounts, [])

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
                            {connected_accounts.length === 0 &&
                                <div>
                                    No accounts connected.  Connect your LoL account below.
                                </div>
                            }
                            {connected_accounts.map((summoner_account) => {
                                return (
                                    <div
                                        key={`${summoner_account.id}`}
                                        className="col l4">
                                        <div className={`card-panel ${theme}`}>
                                            <div>
                                                <span className={`${theme} pill`}>{summoner_account.region}</span>{' '}
                                                <span className={`${theme} pill`}>{summoner_account.summoner_level}</span>{' '}
                                                <span>{summoner_account.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="col l4">
                            <div className={`card-panel ${theme}`}>
                                <div>
                                    Connect a LoL Account
                                </div>

                                <div>
                                    <button
                                        onClick={handleGenerateCode}
                                        className={`${theme} btn-small`}>
                                        Generate Code
                                    </button>
                                </div>

                                <div>
                                    <div>
                                        {uuid.length > 0 &&
                                            <span>
                                                Code:{' '}
                                                <span style={{fontSize: 30}}>
                                                    {uuid}
                                                </span>
                                            </span>
                                        }
                                        {uuid.length === 0 &&
                                            <span>No Code Generated</span>
                                        }
                                    </div>

                                    {uuid.length > 0 &&
                                        <div style={{borderStyle: 'solid', borderWidth: 1, borderRadius: 4, borderColor: 'grey', padding: 7}}>
                                            <div>
                                                <span>
                                                    Copy and paste this code into the <span style={{fontWeight: 'bold'}}>ThirdPartyCode</span>
                                                    {' '}section of the League of Legends Client settings.
                                                </span>
                                            </div>
                                            <div style={{paddingTop: 8}}>
                                                <span>
                                                    After you paste the code into the client, enter your summoner{' '}
                                                    name and click <span style={{fontWeight: 'bold'}}>Connect</span>.
                                                </span>
                                            </div>
                                        </div>
                                    }
                                </div>

                                {uuid.length > 0 &&
                                    <div>
                                        <div className='input-field'>
                                            <input
                                                id='summoner-name-connect'
                                                className={theme}
                                                type="text"
                                                value={summoner_name}
                                                onChange={handleNameChange}
                                            />
                                            <label
                                                htmlFor="summoner-name-connect">
                                                <span>
                                                    Summoner Name
                                                </span>
                                            </label>
                                        </div>
                                        <button
                                            {...connect_attributes}
                                            onClick={handleConnect}
                                            className={`${theme} btn-small`}>
                                            Connect
                                        </button>
                                    </div>
                                }
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

export default Account
