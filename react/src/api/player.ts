import axios, {AxiosRequestConfig} from 'axios'
import * as t from 'io-ts'
import {
  PositionBin,
  unwrap,
  TopPlayedWithPlayer,
  Summoner,
  SummonerSearch,
  Reputation,
  User,
  NameChange,
} from '../types'

let version = 'v1'

axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'


async function getMyUser() {
  const url = `/api/${version}/player/me/`
  const response = await axios.get(url)
  if (response.data.email) {
    return unwrap(User.decode(response.data))
  }
  return null
}

function getSummoner(data: any) {
  let url = `/api/${version}/player/summoner/`
  return axios.post(url, data)
}

async function getSummonerByName(name: string, region: string) {
  const url = `/api/${version}/player/summoner/${region}/by-name/${name}/`
  const response = await axios.get(url)
  return unwrap(Summoner.decode(response.data))
}

interface GetSummonersData extends AxiosRequestConfig {
  puuids: string[]
  region: string
}
async function getSummoners(data: GetSummonersData) {
  const url = `/api/${version}/player/summoners/`
  const r = await axios.post(url, data)
  return unwrap(t.array(Summoner).decode(r.data.data))
}

function getPositions(data: any) {
  let url = `/api/${version}/player/positions/`
  return axios.post(url, data)
}

function signUp(data: any) {
  let url = `/api/${version}/player/sign-up/`
  return axios.post(url, data)
}

function login(data: any) {
  let url = `/api/${version}/player/login/`
  return axios.post(url, data)
}

function verify(data: any) {
  let url = `/api/${version}/player/verify/`
  return axios.post(url, data)
}

function getChampionsOverview(data: any) {
  let url = `/api/${version}/player/champions-overview/`
  return axios.post(url, data)
}

async function summonerSearch(data: any) {
  let url = `/api/${version}/player/summoner-search/`
  const r = await axios.post(url, data)
  return unwrap(t.array(SummonerSearch).decode(r.data.data))
}

function isLoggedIn() {
  let url = `/api/${version}/player/is-logged-in/`
  return axios.post(url)
}

interface GetRankHistoryData extends AxiosRequestConfig {
  id: number
  queue: string
  group_by?: 'day' | 'month' | 'week'
  start?: string | null
  end?: string | null
}
async function getRankHistory(data: GetRankHistoryData) {
  let url = `/api/${version}/player/rank-history/`
  const response = await axios.post(url, data)
  return unwrap(t.array(PositionBin).decode(response.data.data))
}

function getFavorites() {
  let url = `/api/${version}/player/favorites/`
  return axios.get(url)
}

function Favorite(data: any) {
  let url = `/api/${version}/player/favorites/`
  return axios.post(url, data)
}

function generateCode(data: any) {
  let url = `/api/${version}/player/generate-code/`
  return axios.post(url, data)
}

function connectAccount(data: any) {
  let url = `/api/${version}/player/connect-account/`
  return axios.post(url, data)
}

function connectAccountWithProfileIcon(data: any) {
  let url = `/api/${version}/player/connect-account-with-profile-icon/`
  return axios.post(url, data)
}

function getConnectedAccounts() {
  let url = `/api/${version}/player/get-connected-accounts/`
  return axios.post(url)
}

function changePassword(data: any) {
  let url = `/api/${version}/player/change-password/`
  return axios.post(url, data)
}

interface GetTopPlayedWithData extends AxiosRequestConfig {
  summoner_id?: number | null
  account_id?: string | null
  group_by?: 'summoner_name' | 'puuid' | null
  season_id?: number | null
  queue_id?: number | null
  recent?: number | null
  recent_days?: number | null
  start?: number | null
  end?: number | null
}
async function getTopPlayedWith(data: GetTopPlayedWithData) {
  let url = `/api/${version}/player/get-top-played-with/`
  const r = await axios.post(url, data)
  return unwrap(t.array(TopPlayedWithPlayer).decode(r.data.data))
}

function getComments(data: any) {
  let url = `/api/${version}/player/comment/`
  return axios.get(url, {params: data})
}

function getReplies(data: any) {
  let url = `/api/${version}/player/comment/replies/`
  return axios.get(url, {params: data})
}

function createComment(data: any) {
  let url = `/api/${version}/player/comment/`
  return axios.post(url, data)
}

function deleteComment(data: any) {
  let url = `/api/${version}/player/comment/`
  return axios.delete(url, {data})
}

function likeComment(data: any) {
  let url = `/api/${version}/player/comment/like/`
  return axios.put(url, data)
}

function dislikeComment(data: any) {
  let url = `/api/${version}/player/comment/dislike/`
  return axios.put(url, data)
}

function getCommentCount(data: any) {
  let url = `/api/${version}/player/comment/count/`
  return axios.get(url, {params: data})
}

function editDefaultSummoner(data: any) {
  let url = `/api/${version}/player/default-summoner/`
  return axios.post(url, data)
}

async function getReputation(summoner: number) {
  const url = `/api/${version}/player/reputation/${summoner}/`
  const r = await axios.get(url)
  return unwrap(Reputation.decode(r.data))
}

async function createReputation(summoner: number, is_approve: boolean) {
  const url = `/api/${version}/player/reputation/create/`
  const r = await axios.post(url, {summoner, is_approve})
  return unwrap(Reputation.decode(r.data))
}

async function updateReputation(id: number, summoner: number, is_approve: boolean) {
  const url = `/api/${version}/player/reputation/update/${id}/`
  const r = await axios.put(url, {is_approve, summoner})
  return unwrap(Reputation.decode(r.data))
}

async function getNameChanges(id: number) {
  const url = `/api/${version}/player/summoner/${id}/name-changes/`
  const r = await axios.get(url)
  return unwrap(t.array(NameChange).decode(r.data.results))
}

const exports = {
  getSummoner,
  getSummonerByName,
  getSummoners,
  getPositions,
  signUp,
  login,
  verify,
  getChampionsOverview,
  summonerSearch,
  isLoggedIn,
  getRankHistory,
  getFavorites,
  Favorite,
  generateCode,
  connectAccount,
  connectAccountWithProfileIcon,
  getConnectedAccounts,
  changePassword,
  getTopPlayedWith,
  getComments,
  getReplies,
  createComment,
  deleteComment,
  likeComment,
  dislikeComment,
  getCommentCount,
  editDefaultSummoner,
  getReputation,
  createReputation,
  updateReputation,
  getMyUser,
  getNameChanges,
}
export default exports
