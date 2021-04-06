import axios, { AxiosRequestConfig } from 'axios';
import {
    unwrap,
    FullParticipant,
    SpectateMatch,
    Frame,
} from '../types'
import * as t from 'io-ts'

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

interface TimelineData extends AxiosRequestConfig {
    id: number,
}
async function timeline(data: TimelineData) {
    var url = `/api/${version}/match/timeline/`
    const response = await axios.post(url, data)
    return unwrap(t.array(Frame).decode(response.data.data))
}

interface ParticipantsData extends AxiosRequestConfig {
    match__id: number,
    apply_ranks: boolean,
}
async function participants(data: ParticipantsData) {
    var url = `/api/${version}/match/participants/`
    const response = await axios.get(url, {params: data})
    return {data: unwrap(t.array(FullParticipant).decode(response.data.data))}
}

interface GetSpectateData extends AxiosRequestConfig {
    region: string,
    summoner_id: string,
}
async function getSpectate(data: GetSpectateData) {
    var url = `/api/${version}/match/get-spectate/`
    const response = await axios.post(url, data)
    return {data: unwrap(SpectateMatch.decode(response.data.data))}
}

async function checkForLiveGame(data: any) {
    var url = `/api/${version}/match/check-for-live-game/`
    return await axios.post(url, data)
}

async function getMatch(data: any) {
    var url = `/api/${version}/match/get/`
    return await axios.post(url, data)
}

async function setRole(data: any) {
    var url = `/api/${version}/match/participant/set-role/`
    return await axios.post(url, data)
}

async function getLatestUnlabeled(data: any) {
    var url = `/api/${version}/match/get-latest-unlabeled/`
    return await axios.post(url, data)
}

export default {
    timeline,
    participants,
    getSpectate,
    checkForLiveGame,
    getMatch,
    setRole,
    getLatestUnlabeled,
}
