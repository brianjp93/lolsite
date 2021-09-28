import { Fragment, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import numeral from 'numeral'
import { ParticipantItems } from '../../constants/general';
import { rankParticipants } from './rankparticipants'
import { Comments } from '../comment/comments'
import { useEffect } from 'react'
import { getMyPart, formatDatetime, formatDatetimeFull } from '../../constants/general'

function formatName(name) {
    if (name.length > 9) {
        return name.slice(0, 9) + '...'
    }
    return name
}

function matchHighlightColor(queue_id) {
    var out = ''
    // ranked 5v5 solo
    if (queue_id === 420) {
        out = 'highlight1'
    }
    // norms draft
    else if (queue_id === 400) {
        out = ''
    }
    // ranked 5v5 flex
    else if (queue_id === 440) {
        out = 'highlight2'
    }
    // aram
    else if ([100, 450].indexOf(queue_id >= 0)) {
        out = 'highlight3'
    } else if ([900, 1010].indexOf(queue_id >= 0)) {
        out = 'highlight4'
    }
    // 3v3 ranked
    else if ([470].indexOf(queue_id >= 0)) {
        out = 'highlight5'
    } else if ([850].indexOf(queue_id >= 0)) {
        out = 'highlight6'
    }
    return out
}

function MatchCard(props) {
    const [participants, setParticipants] = useState([])
    const [show_comments, setShowComments] = useState(false)
    const theme = props.store.state.theme
    const match = props.match
    const store = props.store
    const pageStore = props.pageStore
    const puuid = props.pageStore.state.summoner.puuid

    const getParticipantRanks = useCallback(() => {
        let participants = rankParticipants(match.participants)
        setParticipants(participants)
    }, [match])

    let _parts = match.participants
    if (participants.length > 0) {
        _parts = participants
    }
    const mypart = getMyPart(_parts, puuid)
    const game_time = match.game_duration / 1000 / 60
    const dpm = mypart.stats.total_damage_dealt_to_champions / game_time
    const vision_score_per_minute = mypart.stats.vision_score / game_time
    // const damage_taken_per_minute = mypart.stats.total_damage_taken / game_time
    // const csm = (mypart.stats.total_minions_killed + mypart.stats.neutral_minions_killed) / game_time
    const isLoss = () => {
        let part = mypart
        let team_id = part.team_id
        if (game_time < 5) {
            return false
        }
        for (let team of match.teams) {
            if (team._id === team_id) {
                return !team.win
            }
        }
        return false
    }
    const isVictory = () => {
        let part = mypart
        let team_id = part.team_id
        if (game_time < 5) {
            return false
        }
        for (let team of match.teams) {
            if (team._id === team_id) {
                return team.win
            }
        }
        return false
    }
    const topBarColor = () => {
        if (isVictory(match)) {
            return props.pageStore.state.victory_color
        } else if (isLoss(match)) {
            return props.pageStore.state.loss_color
        } else {
            return props.pageStore.state.neutral_color
        }
    }
    const getKDA = (part) => {
        if (part !== undefined) {
            let k = part.stats.kills
            let a = part.stats.assists
            let d = part.stats.deaths
            if (d < 1) {
                d = 1
            }
            let kda = (k + a) / d
            kda = Math.round(kda * 100) / 100
            return kda
        }
        return 0
    }
    const kda = getKDA(mypart)
    const convertQueue = (queue) => {
        let convert = {
            'Co-op vs. AI Intermediate Bot': 'Co-op vs Bots Int',
        }
        if (convert[queue] !== undefined) {
            return convert[queue]
        }
        return queue
    }
    const getMaxDamage = (match) => {
        let max = 0
        for (let player of match.participants) {
            if (player.stats.total_damage_dealt_to_champions > max) {
                max = player.stats.total_damage_dealt_to_champions
            }
        }
        return max
    }
    const getDamagePercentage = (part, match) => {
        let perc = (part.stats.total_damage_dealt_to_champions / getMaxDamage(match)) * 100
        perc = Math.round(perc)
        return perc
    }
    const getTotalKills = (match) => {
        let team100 = match.participants.filter((part) => part.team_id === 100)
        let team200 = match.participants.filter((part) => part.team_id === 200)

        let kills = {
            100: 0,
            200: 0,
        }
        let part
        for (part of team100) {
            kills[100] = kills[100] + part.stats.kills
        }
        for (part of team200) {
            kills[200] = kills[200] + part.stats.kills
        }
        return kills
    }
    const getKp = (match, part) => {
        var team_id = part.team_id
        var total = getTotalKills(match)[team_id]
        var kills_and_assists = part.stats.kills + part.stats.assists
        var percentage = 0
        if (total > 0) {
            percentage = (kills_and_assists / total) * 100
        }
        return percentage
    }
    const getTeamMaxKp = (match, team_id) => {
        let max = 0
        let kp
        for (let part of match.participants) {
            if (part.team_id === team_id) {
                kp = getKp(match, part)
                if (kp > max) {
                    max = kp
                }
            }
        }
        return max
    }
    const getTeamKpPercentage = (match, part) => {
        let kp = getKp(match, part)
        let max = getTeamMaxKp(match, part.team_id)
        let perc = (kp / max) * 100
        return perc
    }
    const getTeam = (team_id) => {
        let team = participants.filter((participant) => participant.team_id === team_id)
        return (
            <div>
                {team.map((part) => {
                    let dmg_perc = getDamagePercentage(part, match)
                    let wid = dmg_perc * 0.9

                    let kp = getKp(match, part)
                    let kp_perc = getTeamKpPercentage(match, part)
                    let kp_wid = kp_perc * 0.9

                    if (kp_wid < 0) {
                        kp_wid = 0
                    }
                    if (wid < 0) {
                        wid = 0
                    }
                    let is_me = part.puuid === mypart.puuid

                    return (
                        <div key={`${match.id}-${part._id}`} style={{ position: 'relative' }}>
                            {/* KP PERCENTAGE */}
                            <div
                                title={`${numeral(kp).format('0')}% kp`}
                                style={{
                                    title: `${kp}% kp`,
                                    position: 'absolute',
                                    left: 17,
                                    top: 2,
                                    height: 3,
                                    borderRadius: 10,
                                    width: `${kp_wid}%`,
                                    background: is_me ? '#4b9bcd' : '#4b9bcd60',
                                }}
                            ></div>

                            {/* DAMAGE PERCENTAGE */}
                            <div
                                title={`${numeral(
                                    part.stats.total_damage_dealt_to_champions,
                                ).format('0,0')} damage to champions`}
                                style={{
                                    position: 'absolute',
                                    left: 17,
                                    top: 15,
                                    height: 3,
                                    borderRadius: 10,
                                    width: `${wid}%`,
                                    background: is_me ? '#dc5f5f' : '#dc5f5f60',
                                }}
                            ></div>

                            <img
                                src={part.champion.image?.file_15}
                                alt={part.champion.name}
                                style={{ height: 15, borderRadius: 5, paddingRight: 2 }}
                            />
                            <div
                                title={part.summoner_name}
                                style={{
                                    position: 'relative',
                                    fontSize: 'smaller',
                                    display: 'inline-block',
                                    verticalAlign: 'top',
                                }}
                                key={`${match._id}-${part._id}`}
                            >
                                {is_me && (
                                    <small style={{ fontWeight: 'bold' }}>
                                        {formatName(part.summoner_name)}
                                    </small>
                                )}
                                {!is_me && (
                                    <small>
                                        {part.puuid !== '0' && (
                                            <Link
                                                target="_blank"
                                                title={part.summoner_name}
                                                className={`${theme} silent`}
                                                to={`/${pageStore.props.region}/${part.summoner_name}/`}
                                            >
                                                {formatName(part.summoner_name)}
                                            </Link>
                                        )}
                                        {part.puuid === '0' && (
                                            <span title={part.summoner_name}>
                                                {formatName(part.summoner_name)}
                                            </span>
                                        )}
                                    </small>
                                )}
                            </div>
                            <small
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 2,
                                    fontSize: 'x-small',
                                }}
                            >
                                {part.stats.kills}/{part.stats.deaths}/{part.stats.assists}
                            </small>
                        </div>
                    )
                })}
            </div>
        )
    }

    useEffect(() => {
        getParticipantRanks()
    }, [match, getParticipantRanks])

    const TEAMSWIDTH = 120
    const TOPPAD = 20
    const CARDHEIGHT = 130
    const RIGHT_SPLIT = 70

    if (mypart !== undefined) {
        return (
            <>
                <div
                    style={{height: CARDHEIGHT}}
                    className={`card-panel ${theme} match-card`}
                >
                    <div
                        className="win-loss-card-bar"
                        style={{ background: `${topBarColor()}` }}
                    ></div>
                    <div
                        style={{
                            display: 'inline-block',
                            paddingRight: 5,
                            verticalAlign: 'top',
                            paddingTop: TOPPAD,
                        }}
                    >
                        <div>
                            <img
                                style={{ height: 40, display: 'inline' }}
                                src={mypart.champion.image?.file_40}
                                alt=""
                            />
                            <div style={{ display: 'inline-block', paddingLeft: 4 }}>
                                <img
                                    style={{ height: 20, display: 'block' }}
                                    src={mypart.spell_1_image}
                                    alt=""
                                />
                                <img
                                    style={{ height: 20, display: 'block' }}
                                    src={mypart.spell_2_image}
                                    alt=""
                                />
                            </div>
                        </div>
                        <img
                            style={{ height: 20, verticalAlign: 'top' }}
                            src={mypart.stats.perk_0_image_url}
                            alt=""
                        />
                        <img
                            style={{ height: 20, verticalAlign: 'top' }}
                            src={mypart.stats.perk_sub_style_image_url}
                            alt=""
                        />
                        <img
                            style={{
                                height: 20,
                                verticalAlign: 'top',
                                marginLeft: 4,
                                borderRadius: 5,
                            }}
                            src={mypart.stats.item_6_image?.file_30}
                            alt=""
                        />
                    </div>

                    <span
                        style={{
                            display: 'inline-block',
                            verticalAlign: 'top',
                            paddingTop: TOPPAD,
                        }}
                    >
                      <ParticipantItems part={mypart} match={match} store={store} />
                    </span>

                    <div
                        style={{
                            display: 'inline-block',
                            width: 100,
                            textAlign: 'center',
                            verticalAlign: 'top',
                            paddingTop: 0,
                        }}
                    >
                        {mypart.impact_rank === 1 && (
                            <div style={{ fontSize: 'small' }}>
                                <div
                                    style={{
                                        display: 'inline-block',
                                        borderRadius: 4,
                                        background:
                                            'linear-gradient(90deg, rgba(66,66,93,1) 0%, rgba(133,74,128,1) 100%)',
                                        padding: '0px 5px',
                                    }}
                                >
                                    MVP
                                </div>
                            </div>
                        )}
                        {mypart.impact_rank !== 1 && <div style={{ height: 19 }}></div>}
                        <div style={{ fontSize: 'small' }}>
                            {mypart.stats.kills} / {mypart.stats.deaths} / {mypart.stats.assists}
                        </div>
                        <div style={{ fontSize: 'small' }}>{kda} KDA</div>
                        <div style={{ fontSize: 'small' }}>{numeral(dpm).format('0,0')} DPM</div>
                        <div style={{ fontSize: 'small' }}>
                            {numeral(vision_score_per_minute).format('0,0.00')} VS/M
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'inline-block',
                            width: TEAMSWIDTH,
                        }}
                    >
                        {getTeam(100)}
                    </div>
                    <div style={{ display: 'inline-block', width: 8 }}></div>
                    <div
                        style={{
                            display: 'inline-block',
                            width: TEAMSWIDTH,
                        }}
                    >
                        {getTeam(200)}
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            top: 10,
                            left: 26,
                        }}
                    >
                        <small
                            title={formatDatetimeFull(match.game_creation)}
                            style={{ lineHeight: 1, display: 'inline-block' }}
                        >
                            {formatDatetime(match.game_creation)}
                        </small>
                        <small style={{ lineHeight: 1, display: 'inline-block', paddingLeft: 10 }}>
                            {`${Math.floor(game_time)}:${numeral(
                                (match.game_duration / 1000) % 60,
                            ).format('00')}`}
                        </small>
                    </div>

                    <div style={{ display: 'block', position: 'absolute', bottom: 3, left: 26 }}>
                        <small
                            className={`${store.state.theme} ${matchHighlightColor(
                                match.queue_id,
                            )}`}
                        >
                            {pageStore.state.queues[match.queue_id] && (
                                <Fragment>
                                    {convertQueue(
                                        pageStore.state.queues[match.queue_id].description,
                                    )}
                                </Fragment>
                            )}
                            {pageStore.state.queues[match.queue_id] === undefined && (
                                <Fragment>{match.queue_id}</Fragment>
                            )}
                        </small>
                    </div>

                    <button
                        onClick={() => setShowComments(!show_comments)}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            backgroundColor: '#ffffff20',
                            width: 40,
                            height: RIGHT_SPLIT,
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderStyle: null,
                            borderWidth: 0,
                        }}
                    >
                        <i style={{ paddingTop: 8 }} className="tiny material-icons">
                            message
                        </i>
                        {props.comment_count !== undefined && <div>{props.comment_count}</div>}
                    </button>
                    <Link
                        to={`match/${match._id}/`}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: RIGHT_SPLIT,
                            backgroundColor: '#ffffff20',
                            width: 40,
                            height: CARDHEIGHT - RIGHT_SPLIT,
                            textAlign: 'center',
                        }}
                    >
                        <i
                            className="material-icons"
                            style={{ position: 'absolute', bottom: 5, right: 8 }}
                        >
                            arrow_downward
                        </i>
                    </Link>
                </div>
                {show_comments && (
                    <div
                        style={{
                            width: 600,
                            paddingTop: 15,
                            paddingBottom: 10,
                            position: 'relative',
                        }}
                        className={`card-panel ${theme}`}
                    >
                        <Comments match={match} theme={theme} />
                    </div>
                )}
            </>
        )
    } else {
        return <div></div>
    }
}
MatchCard.propTypes = {
    match: PropTypes.object,
    mypart: PropTypes.object,
    store: PropTypes.object,
    pageStore: PropTypes.object,
}

export default MatchCard
