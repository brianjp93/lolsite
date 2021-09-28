import * as t from 'io-ts'
import {optional, maybe} from './base'

export const Position = t.type({
  checkpoint: t.number,
  fresh_blood: t.boolean,
  hot_streak: t.boolean,
  id: t.number,
  inactive: t.boolean,
  league_points: t.number,
  losses: t.number,
  position: t.string,
  queue_type: t.string,
  rank: t.string,
  rank_integer: t.number,
  series_progress: optional(t.string),
  tier: t.string,
  veteran: t.boolean,
  wins: t.number,
})
export type PositionType = t.TypeOf<typeof Position>

export const RankExtreme = t.type({
  tier: t.string,
  division: t.string,
  league_points: t.number,
})

export const PositionBin = t.type({
  day: t.number,
  month: t.number,
  peak_rank: RankExtreme,
  peak_rank_integer: t.number,
  start_date: t.string,
  trough_rank: RankExtreme,
  trough_rank_integer: t.number,
  week: t.number,
  year: t.number,
})
export type PositionBinType = t.TypeOf<typeof PositionBin>

export const Summoner = t.type({
  account_id: t.string,
  created_date: t.string,
  full_import_count: t.number,
  id: t.number,
  last_summoner_page_import: optional(t.string),
  name: t.string,
  pro: optional(t.number),
  profile_icon_id: t.number,
  puuid: t.string,
  ranked_import_count: t.number,
  region: t.string,
  revision_date: t.number,
  simple_name: t.string,
  summoner_level: t.number,
  user: optional(t.number),
  _id: t.string,
})
export type SummonerType = t.TypeOf<typeof Summoner>

export const SummonerSearch = t.type({
  name: t.string,
  summoner_level: optional(t.number),
})
export type SummonerSearchType = t.TypeOf<typeof SummonerSearch>

export const TopPlayedWithPlayer = t.type({
  puuid: maybe(t.string),
  summoner_name: maybe(t.string),
  wins: t.number,
  count: t.number,
})
export type TopPlayedWithPlayerType = t.TypeOf<typeof TopPlayedWithPlayer>
