import axios, {AxiosRequestConfig} from 'axios'
import {
  unwrap,
  FullParticipant,
  SpectateMatch,
  BasicMatch,
  Frame,
  Ban,
  PaginatedResponse,
} from '../types'
import * as t from 'io-ts'

var version = 'v1'

axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

async function timeline(_id: string) {
  var url = `/api/${version}/match/timeline/`
  const response = await axios.get(url, {params: {id: _id}})
  return unwrap(t.array(Frame).decode(response.data.data))
}

interface ParticipantsData extends AxiosRequestConfig {
  match__id: number
  apply_ranks: boolean
}
async function participants(data: ParticipantsData) {
  var url = `/api/${version}/match/participants/`
  const response = await axios.get(url, {params: data})
  return {data: unwrap(t.array(FullParticipant).decode(response.data.data))}
}

interface GetSpectateData extends AxiosRequestConfig {
  region: string
  summoner_id: string
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

async function getMatchesBySummonerName({
  summoner_name,
  region,
  queue,
  sync_import,
  start = 0,
  limit = 10,
}: {
  summoner_name: string
  region: string
  sync_import?: boolean,
  start?: number
  limit?: number
  queue?: number | string,
}) {
  const url = `/api/${version}/match/by-summoner/${region}/${summoner_name}/`
  const params = {
    start,
    limit,
    queue,
    sync_import,
  }
  const response = await axios.get(url, {params})
  return unwrap(PaginatedResponse(BasicMatch).decode(response.data))
}

async function setRole(data: any) {
  var url = `/api/${version}/match/participant/set-role/`
  return await axios.post(url, data)
}

async function getLatestUnlabeled(data: any) {
  var url = `/api/${version}/match/get-latest-unlabeled/`
  return await axios.post(url, data)
}

async function bans(match_id: string) {
  const url = `/api/${version}/match/${match_id}/bans/`
  const response = await axios.get(url)
  return unwrap(PaginatedResponse(Ban).decode(response.data))
}

const exports = {
  timeline,
  participants,
  getSpectate,
  checkForLiveGame,
  getMatch,
  setRole,
  getLatestUnlabeled,
  bans,
  getMatchesBySummonerName,
}

export default exports
