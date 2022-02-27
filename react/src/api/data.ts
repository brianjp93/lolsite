import axios from 'axios'

var version = 'v1'

axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

function getItem(data: any) {
  var url = `/api/${version}/data/item/`
  return axios.post(url, data)
}

function items(data: any) {
  var url = `/api/${version}/data/items/`
  return axios.post(url, data)
}

function getRunes(data: any) {
  var url = `/api/${version}/data/reforged-runes/`
  return axios.post(url, data)
}

function getCurrentSeason() {
  var url = `/api/${version}/data/get-current-season/`
  return axios.post(url)
}

async function getChampions(data?: any) {
  var url = `/api/${version}/data/champions/`
  return axios.post(url, data)
}

function getChampionSpells(data: any) {
  var url = `/api/${version}/data/champion-spells/`
  return axios.post(url, data)
}

const exports = {
  getItem,
  getRunes,
  items,
  getCurrentSeason,
  getChampions,
  getChampionSpells,
}
export default exports
