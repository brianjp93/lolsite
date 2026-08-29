import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import {
  FullParticipant,
  SpectateMatch,
  BasicMatch,
  Ban,
  PaginatedResponse,
} from "../types";
import { z } from "zod";
import {
  MatchSummary,
  SimpleMatch,
  SimpleSpectate,
  MajorPatchesResponse,
  AdvancedTimeline,
} from "../iotypes/match";

const version = "v1";
const base = `/api/${version}/match`;

axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";

async function timeline(_id: string) {
  const url = `${base}/${_id}/timeline/`;
  const response = await axios.get(url);
  return AdvancedTimeline.parse(response.data);
}

interface ParticipantsData extends AxiosRequestConfig {
  match__id: string;
  apply_ranks: boolean;
}
async function participants(data: ParticipantsData) {
  const url = `${base}/participants/`;
  const response = await axios.get(url, { params: data });
  return { data: z.array(FullParticipant).parse(response.data.data) };
}

interface GetSpectateData extends AxiosRequestConfig {
  region: string;
  puuid: string;
}
async function getSpectate(data: GetSpectateData) {
  const url = `${base}/get-spectate/`;
  const response = await axios.get(url, {
    params: { region: data.region, puuid: data.puuid },
  });
  return z.union([SpectateMatch, z.literal("not found")]).parse(response.data);
}

async function checkForLiveGame(data: { puuid: string; region: string }) {
  const url = `${base}/check-for-live-game/`;
  const r = await axios.get(url, { params: data });
  return z.union([SimpleSpectate, z.literal("not found")]).parse(r.data);
}

async function getMatch(match_id: string) {
  const url = `${base}/${match_id}/`;
  const response = await axios.get(url);
  return SimpleMatch.parse(response.data);
}

async function getMatchesByRiotIdName({
  riot_id_name,
  riot_id_tagline,
  region,
  queue,
  sync_import,
  playedWith,
  start = 0,
  limit = 10,
}: {
  riot_id_name: string;
  riot_id_tagline: string;
  region: string;
  sync_import?: boolean;
  playedWith?: string;
  start?: number;
  limit?: number;
  queue?: number | string;
}) {
  if (!riot_id_name || !region || !riot_id_tagline) {
    throw new Error("summoner and region required.");
  }
  const url = `${base}/by-summoner/${region}/${riot_id_name}/${riot_id_tagline}/`;
  const params = {
    start,
    limit,
    queue,
    playedWith,
    sync_import,
  };
  const response = await axios.get(url, { params });
  return PaginatedResponse(BasicMatch).parse(response.data);
}

async function setRole(data: any) {
  const url = `${base}/participant/set-role/`;
  return await axios.post(url, data);
}

async function getLatestUnlabeled(data: any) {
  const url = `${base}/get-latest-unlabeled/`;
  return await axios.post(url, data);
}

async function bans(match_id: string) {
  const url = `${base}/${match_id}/bans/`;
  const response = await axios.get(url);
  return PaginatedResponse(Ban).parse(response.data);
}

async function getMatchSummary(match_id: string) {
  const url = `${base}/${match_id}/summary/`;
  const response = await axios.get(url);
  return MatchSummary.parse(response.data);
}

async function getMajorPatches() {
  const url = `${base}/major-patches/`;
  const response = await axios.get(url);
  return MajorPatchesResponse.parse(response.data);
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
  getMatchesByRiotIdName,
  getMatchSummary,
  getMajorPatches,
};

export default exports;
