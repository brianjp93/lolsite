import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getSummoner(data) {
    let url = `/api/${version}/player/summoner/`
    return axios.post(url, data)
}

function getSummonerPage(data) {
    let url = `/api/${version}/player/summoner-page/`
    return axios.post(url, data)
}

function getPositions(data) {
    let url = `/api/${version}/player/positions/`
    return axios.post(url, data)
}

function signUp(data) {
    let url = `/api/${version}/player/sign-up/`
    return axios.post(url, data)
}

function login(data) {
    let url = `/api/${version}/player/login/`
    return axios.post(url, data)
}

function verify(data) {
    let url = `/api/${version}/player/verify/`
    return axios.post(url, data)
}

function getChampionsOverview(data) {
    let url = `/api/${version}/player/champions-overview/`
    return axios.post(url, data)
}

function summonerSearch(data) {
    let url = `/api/${version}/player/summoner-search/`
    return axios.post(url, data)
}

function isLoggedIn() {
    let url = `/api/${version}/player/is-logged-in/`
    return axios.post(url)
}

function getRankHistory(data) {
    let url = `/api/${version}/player/rank-history/`
    return axios.post(url, data)
}

function getFavorites() {
    let url = `/api/${version}/player/favorites/`
    return axios.get(url)
}

function Favorite(data) {
    let url = `/api/${version}/player/favorites/`
    return axios.post(url, data)
}

export default {
    getSummoner,
    getSummonerPage,
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
}
