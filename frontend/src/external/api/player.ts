import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { z } from "zod";
import {
  PositionBin,
  TopPlayedWithPlayer,
  Summoner,
  Reputation,
  User,
  NameChange,
  Favorite,
  PaginatedResponse,
} from "../types";
import {
  Comment,
  PlayerChampionSummaryResponse,
  Position,
  SuspiciousPlayer,
} from "../iotypes/player";
import { get_default_headers } from "./common";

const version = "v1";
const base = `/api/${version}/player`;

axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.withCredentials = true;

async function getMyUser() {
  const url = `${base}/me/`;
  const response = await axios.get(url);
  if (response.data.email) {
    return User.parse(response.data);
  }
  return null;
}

async function getSummoner(data: { puuid: string; region?: string }) {
  const url = `${base}/summoner/`;
  const response = await axios.post(url, data, get_default_headers());
  return Summoner.parse(response.data.data);
}

async function getSummonerByRiotId(
  riotIdName: string,
  riotIdTagline: string,
  region: string,
) {
  const url = `${base}/summoner/by-riot-id/${region}/${riotIdName}/${riotIdTagline}/`;
  const response = await axios.get(url);
  return Summoner.parse(response.data);
}

interface GetSummonersData extends AxiosRequestConfig {
  puuids: string[];
  region: string;
}
async function getSummoners(data: GetSummonersData) {
  const url = `${base}/summoners/`;
  const r = await axios.post(url, data, get_default_headers());
  return z.array(Summoner).parse(r.data.data);
}

async function getPositions(data: {
  puuid?: string;
  riot_id_name?: string;
  riot_id_tagline?: string;
  region?: string;
  update?: boolean;
}) {
  const url = `${base}/positions/`;
  const response = await axios.get(url, { params: data });
  return z.array(Position).parse(response.data.data);
}

function signUp({
  email,
  password,
  token,
}: {
  email: string;
  password: string;
  token: string;
}) {
  const data = { email, password, token };
  const url = `${base}/sign-up/`;
  return axios.post(url, data, get_default_headers());
}

function verify(code: string) {
  const url = `${base}/verify/`;
  return axios.post(url, { code }, get_default_headers());
}

async function getChampionsOverview(data: any) {
  const url = `${base}/champions-overview/`;
  const response = await axios.get(url, { params: data });
  return z
    .object({
      count: z.number(),
      data: z.array(PlayerChampionSummaryResponse),
    })
    .parse(response.data);
}

async function summonerSearch(params: {
  simple_riot_id__startswith?: string;
  region: string;
  order_by?: string;
  start?: number;
  end?: number;
}) {
  const url = `${base}/summoner-search/`;
  const r = await axios.get(url, { params });
  return z.array(Summoner).parse(r.data.data);
}

function isLoggedIn() {
  const url = `${base}/is-logged-in/`;
  return axios.post(url, get_default_headers());
}

interface GetRankHistoryData extends AxiosRequestConfig {
  id: number;
  queue: string;
  group_by?: "day" | "month" | "week";
  start?: string | null;
  end?: string | null;
}
async function getRankHistory(data: GetRankHistoryData) {
  const url = `${base}/rank-history/`;
  const response = await axios.post(url, data, get_default_headers());
  return z.array(PositionBin).parse(response.data.data);
}

async function getFollowList() {
  const url = `${base}/following/`;
  const response = await axios.get(url);
  return z.array(Summoner).parse(response.data);
}

async function setFollow({ id }: { id: number }) {
  const url = `${base}/following/`;
  const response = await axios.post(url, { id }, get_default_headers());
  return z.array(Summoner).parse(response.data);
}

async function removeFollow({ id }: { id: number }) {
  const url = `${base}/following/`;
  const response = await axios.delete(url, {
    data: { id },
    ...get_default_headers(),
  });
  return z.array(Summoner).parse(response.data);
}

async function getFavorites() {
  const url = `${base}/favorites/`;
  const response = await axios.get(url);
  return z.array(Favorite).parse(response.data.data);
}

async function setFavorite(summoner_id: number) {
  const url = `${base}/favorites/`;
  const response = await axios.post(
    url,
    { verb: "set", summoner_id },
    get_default_headers(),
  );
  return response.status;
}

async function removeFavorite(summoner_id: number) {
  const url = `${base}/favorites/`;
  const response = await axios.post(
    url,
    { verb: "remove", summoner_id },
    get_default_headers(),
  );
  return response.status;
}

async function setFavoriteOrder(favorites: string[]) {
  const url = `${base}/favorites/`;
  const response = await axios.post(
    url,
    { verb: "order", favorite_ids: favorites },
    get_default_headers(),
  );
  return response.status;
}

function generateCode(data: {
  action: string;
  simple_riot_id?: string;
  region?: string;
}) {
  const url = `${base}/generate-code/`;
  return axios.post(url, data, get_default_headers());
}

function connectAccount(data: any) {
  const url = `${base}/connect-account/`;
  return axios.post(url, data, get_default_headers());
}

function unlinkAccount(puuid: string) {
  const url = `${base}/unlink-account/`;
  const data = get_default_headers();
  return axios.request({ method: "DELETE", data: { puuid }, url, ...data });
}

function connectAccountWithProfileIcon(data: any) {
  const url = `${base}/connect-account-with-profile-icon/`;
  return axios.post(url, data, get_default_headers());
}

async function getConnectedAccounts() {
  const url = `${base}/get-connected-accounts/`;
  const response = await axios.get(url);
  return z.array(Summoner).parse(response.data.data);
}

function changePassword(data: any) {
  const url = `${base}/change-password/`;
  return axios.post(url, data, get_default_headers());
}

interface GetTopPlayedWithData extends AxiosRequestConfig {
  summoner_id?: number | null;
  account_id?: string | null;
  group_by?: "summoner_name" | "puuid" | null;
  season_id?: number | null;
  queue_id?: number | null;
  recent?: number | null;
  recent_days?: number | null;
  start?: number | null;
  end?: number | null;
}
async function getTopPlayedWith(data: GetTopPlayedWithData) {
  const url = `${base}/get-top-played-with/`;
  const r = await axios.post(url, data, get_default_headers());
  return z.array(TopPlayedWithPlayer).parse(r.data.data);
}

function getComments(data: any) {
  const url = `${base}/comment/`;
  return axios.get(url, { params: data });
}

function getReplies(data: any) {
  const url = `${base}/comment/replies/`;
  return axios.get(url, { params: data });
}

function createComment(data: {
  markdown: string;
  match: number;
  reply_to?: number;
  summoner: string;
}) {
  const url = `${base}/comment/`;
  return axios.post(url, data, get_default_headers());
}

function updateComment({ id, markdown }: { id: number; markdown: string }) {
  const url = `${base}/comment/${id}/`;
  return axios.put(url, { markdown });
}

function deleteComment({ id }: { id: number }) {
  const url = `${base}/comment/${id}/`;
  return axios.delete(url);
}

function likeComment(data: any) {
  const url = `${base}/comment/like/`;
  return axios.put(url, data);
}

function dislikeComment(data: any) {
  const url = `${base}/comment/dislike/`;
  return axios.put(url, data);
}

function getCommentCount(matchIds: number[]) {
  const url = `${base}/comment/count/`;
  return axios.get(url, { params: { match_ids: matchIds } });
}

function editDefaultSummoner(data: any) {
  const url = `${base}/default-summoner/`;
  return axios.post(url, data, get_default_headers());
}

async function getReputation(summoner: number) {
  const url = `${base}/reputation/${summoner}/`;
  const r = await axios.get(url);
  return Reputation.parse(r.data);
}

async function createReputation(summoner: number, is_approve: boolean) {
  const url = `${base}/reputation/create/`;
  const r = await axios.post(
    url,
    { summoner, is_approve },
    get_default_headers(),
  );
  return Reputation.parse(r.data);
}

async function updateReputation(
  id: number,
  summoner: number,
  is_approve: boolean,
) {
  const url = `${base}/reputation/update/${id}/`;
  const r = await axios.put(url, { is_approve, summoner });
  return Reputation.parse(r.data);
}

async function getNameChanges(data: {
  puuid?: string;
  riot_id_name?: string;
  riot_id_tagline?: string;
  region?: string;
}) {
  const url = `${base}/name-changes/`;
  const r = await axios.get(url, { params: data });
  return z.array(NameChange).parse(r.data.results);
}

async function login({ email, password }: { email: string; password: string }) {
  const url = `${base}/login/`;
  const response = await axios.post(
    url,
    {
      email,
      password,
    },
    get_default_headers(),
  );
  return response;
}

async function logout() {
  const url = `${base}/logout/`;
  const response = await axios.post(url, {}, get_default_headers());
  return response.status;
}

async function isSuspicious(puuid: string) {
  const url = `${base}/is_suspicious/`;
  const response = await axios.get(url, { params: { puuid } });
  return SuspiciousPlayer.parse(response.data);
}

async function getMatchComments({
  page,
  match_id,
}: {
  page: number;
  match_id: number;
}) {
  const url = `${base}/comment/match/${match_id}`;
  const response = await axios.get(url, { params: { page } });
  return PaginatedResponse(Comment).parse(response.data);
}

async function getComment(pk: number) {
  const url = `${base}/comment/${pk}/`;
  const response = await axios.get(url);
  return Comment.parse(response.data);
}

async function saveSummonerNote({
  summoner_id,
  note,
}: {
  summoner_id: number;
  note: string;
}) {
  const url = `${base}/summoner-note/`;
  const response = await axios.post(
    url,
    { summoner_id, note },
    get_default_headers(),
  );
  return response.data;
}

const exports = {
  getSummoner,
  getSummonerByRiotId,
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
  setFavorite,
  removeFavorite,
  generateCode,
  connectAccount,
  connectAccountWithProfileIcon,
  getConnectedAccounts,
  changePassword,
  getTopPlayedWith,
  getComments,
  getReplies,
  createComment,
  updateComment,
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
  logout,
  setFavoriteOrder,
  isSuspicious,
  unlinkAccount,
  getMatchComments,
  getComment,
  getFollowList,
  setFollow,
  removeFollow,
  saveSummonerNote,
};
export default exports;
