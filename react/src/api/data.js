import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getProfileIcon(data) {
    var url = `/api/${version}/data/profile-icon/`
    return axios.post(url, data)
}

function getItem(data) {
    var url = `/api/${version}/data/item/`
    return axios.post(url, data)
}

function items(data) {
    var url = `/api/${version}/data/items/`
    return axios.post(url, data)
}

function getRunes(data) {
    var url = `/api/${version}/data/reforged-runes/`
    return axios.post(url, data)
}

function getCurrentSeason() {
    var url = `/api/${version}/data/get-current-season/`
    return axios.post(url)
}

function getChampions(data) {
    var url = `/api/${version}/data/champions/`
    return axios.post(url, data)
}

export default {
    getProfileIcon,
    getItem,
    getRunes,
    items,
    getCurrentSeason,
    getChampions,
}