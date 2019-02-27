import axios from 'axios';

var version = 'v1';

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";


function getSummoner(data) {
    var url = `/api/${version}/player/summoner/`
    return axios.post(url, data)
}

function getSummonerPage(data) {
    var url = `/api/${version}/player/summoner-page/`
    return axios.post(url, data)
}

function getPositions(data) {
    var url = `/api/${version}/player/positions/`
    return axios.post(url, data)
}


export default {
    getSummoner,
    getSummonerPage,
    getPositions,
}