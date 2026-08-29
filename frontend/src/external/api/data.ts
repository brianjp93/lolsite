import axios from "axios";
import {
  Rune,
  BasicChampionWithImage,
  PaginatedResponse,
} from "@/external/types";
import { Item, Queue, SimpleItem } from "../iotypes/data";
import { z } from "zod";
import { getCookie } from "./common";

const version = "v1";
const base = `/api/${version}/data`;

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

async function getQueues() {
  const url = `${base}/queues/`;
  const response = await axios.get(url);
  return z.array(Queue).parse(response.data);
}

function getItem(data: any) {
  const url = `${base}/item/`;
  return axios.post(url, data);
}

async function getItemDiff(itemId: string) {
  const url = `${base}/item/diff/${itemId}/`;
  const response = await axios.get(url);
  return z.array(Item).parse(response.data);
}

function getSimpleItem(
  _id: number,
  major: number | string,
  minor: number | string,
) {
  const url = `${base}/item/${major}/${minor}/${_id}/`;
  return axios.get(url);
}

async function getSimpleItemList(
  major: number | string,
  minor: number | string,
) {
  const url = `${base}/items/${major}/${minor}/`;
  const response = await axios.get(url);
  return PaginatedResponse(SimpleItem).parse(response.data);
}

async function items({
  major,
  minor,
  patch,
  map_id,
}: {
  major?: number | string;
  minor?: number | string;
  patch?: number | string;
  map_id?: number;
}) {
  const url = `${base}/items/`;
  const r = await axios.get(url, { params: { major, minor, patch, map_id } });
  return z
    .object({
      data: z.array(Item),
      version: z.string(),
    })
    .parse(r.data);
}

async function getRunes(data: any) {
  const url = `${base}/reforged-runes/`;
  const response = await axios.post(url, data, {
    headers: { "X-CSRFToken": getCookie("csrftoken") },
  });
  return z.array(Rune).parse(response.data.data);
}

function getCurrentSeason() {
  const url = `${base}/get-current-season/`;
  return axios.post(url);
}

async function getChampions(data?: any) {
  const url = `${base}/champions/`;
  return axios.post(url, data);
}

function getChampionSpells(data: any) {
  const url = `${base}/champion-spells/`;
  return axios.post(url, data);
}

async function basicChampions() {
  const url = `${base}/basic-champions/`;
  const response = await axios.get(url);
  return PaginatedResponse(BasicChampionWithImage).parse(response.data);
}

async function getStaticUrl() {
  const url = `${base}/get-static-url/`;
  const response = await axios.get(url);
  return z.string().parse(response.data);
}

async function getMediaUrl() {
  const url = `${base}/get-media-url/`;
  const response = await axios.get(url);
  return z.string().parse(response.data);
}

async function getGoogleRecaptchaSiteKey() {
  const url = `${base}/google-recaptcha-site-key/`;
  const response = await axios.get(url);
  return z.string().parse(response.data);
}

const exports = {
  getItem,
  getSimpleItem,
  getRunes,
  items,
  getCurrentSeason,
  getChampions,
  getChampionSpells,
  basicChampions,
  getStaticUrl,
  getMediaUrl,
  getQueues,
  getGoogleRecaptchaSiteKey,
  getItemDiff,
  getSimpleItemList,
};
export default exports;
