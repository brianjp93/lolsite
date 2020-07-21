import axios from 'axios'

var version = 'v1'

axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

function getSummoner(data) {
    let url = `/api/${version}/player/summoner/`
    return axios.post(url, data)
}

function getSummoners(data) {
    let url = `/api/${version}/player/summoners/`
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

function generateCode(data) {
    let url = `/api/${version}/player/generate-code/`
    return axios.post(url, data)
}

function connectAccount(data) {
    let url = `/api/${version}/player/connect-account/`
    return axios.post(url, data)
}

function connectAccountWithProfileIcon(data) {
    let url = `/api/${version}/player/connect-account-with-profile-icon/`
    return axios.post(url, data)
}

function getConnectedAccounts() {
    let url = `/api/${version}/player/get-connected-accounts/`
    return axios.post(url)
}

function changePassword(data) {
    let url = `/api/${version}/player/change-password/`
    return axios.post(url, data)
}

function getTopPlayedWith(data) {
    let url = `/api/${version}/player/get-top-played-with/`
    return axios.post(url, data)
}

function getComments(data) {
    let url = `/api/${version}/player/comment/`
    return axios.get(url, { params: data })
}

function getReplies(data) {
    let url = `/api/${version}/player/comment/replies/`
    return axios.get(url, { params: data })
}

function createComment(data) {
    let url = `/api/${version}/player/comment/`
    return axios.post(url, data)
}

function deleteComment(data) {
    let url = `/api/${version}/player/comment/`
    return axios.delete(url, {data})
}

function likeComment(data) {
    let url = `/api/${version}/player/comment/like/`
    return axios.put(url, data)
}

function dislikeComment(data) {
    let url = `/api/${version}/player/comment/dislike/`
    return axios.put(url, data)
}

function getCommentCount(data) {
    let url = `/api/${version}/player/comment/count/`
    return axios.get(url, { params: data })
}

export default {
    getSummoner,
    getSummoners,
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
}
