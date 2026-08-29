import axios from "axios";
import { MetaHead } from "../iotypes/base";

const version = "v1";

axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

const base = `/api/${version}`;

async function getSummonerMetaData({
  name,
  region,
}: {
  name: string;
  region: string;
}) {
  const url = `${base}/summoner-metadata/${region}/${name}/`;
  try {
    const res = await fetch(url);
    const response = await res.json();
    return MetaHead.parse(response);
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getMatchMetaData({
  name,
  region,
  matchId,
}: {
  name: string;
  region: string;
  matchId: string;
}) {
  const url = `${base}/match-metadata/${region}/${name}/${matchId}/`;
  try {
    const res = await fetch(url);
    const response = await res.json();
    return MetaHead.parse(response);
  } catch (error) {
    console.log(error);
    return null;
  }
}

const exports = {
  getSummonerMetaData,
  getMatchMetaData,
};
export default exports;
