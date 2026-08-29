import { z } from "zod";

export const User = z.object({
  email: z.string(),
});
export type UserType = z.infer<typeof User>;

export const NameChange = z.object({
  old_name: z.string(),
  created_date: z.string(),
});
export type NameChangeType = z.infer<typeof NameChange>;

export const Position = z.object({
  checkpoint: z.number(),
  fresh_blood: z.boolean(),
  hot_streak: z.boolean(),
  id: z.number(),
  inactive: z.boolean(),
  league_points: z.number(),
  losses: z.number(),
  position: z.string(),
  queue_type: z.string(),
  rank: z.string(),
  rank_integer: z.number(),
  series_progress: z.string().nullable(),
  tier: z.string(),
  veteran: z.boolean(),
  wins: z.number(),
});
export type PositionType = z.infer<typeof Position>;

export const RankExtreme = z.object({
  tier: z.string(),
  division: z.string(),
  league_points: z.number(),
});

export const PositionBin = z.object({
  day: z.number(),
  month: z.number(),
  peak_rank: RankExtreme,
  peak_rank_integer: z.number(),
  start_date: z.string(),
  trough_rank: RankExtreme,
  trough_rank_integer: z.number(),
  week: z.number(),
  year: z.number(),
});
export type PositionBinType = z.infer<typeof PositionBin>;

export const SummonerNote = z.object({
  note: z.string(),
  created_date: z.coerce.date(),
  modified_date: z.coerce.date(),
});
export type SummonerNoteType = z.infer<typeof SummonerNote>;

export const Summoner = z.object({
  has_match_overlap: z.number(),
  id: z.number(),
  profile_icon_id: z.number(),
  profile_icon: z.string(),
  puuid: z.string(),
  region: z.string(),
  summoner_level: z.number(),
  riot_id_name: z.string(),
  riot_id_tagline: z.string(),
  notes: SummonerNote.nullable(),
});
export type SummonerType = z.infer<typeof Summoner>;

export const SummonerSearch = z.object({
  name: z.string(),
  summoner_level: z.number().nullable(),
});
export type SummonerSearchType = z.infer<typeof SummonerSearch>;

export const TopPlayedWithPlayer = z.object({
  puuid: z.string().optional(),
  summoner_name: z.string().optional(),
  wins: z.number(),
  count: z.number(),
});
export type TopPlayedWithPlayerType = z.infer<typeof TopPlayedWithPlayer>;

export const Reputation = z.object({
  id: z.number(),
  is_approve: z.boolean(),
});
export type ReputationType = z.infer<typeof Reputation>;

export const Favorite = z.object({
  name: z.string(),
  region: z.string(),
  sort_int: z.number(),
  puuid: z.string(),
  riot_id_name: z.string(),
  riot_id_tagline: z.string(),
});
export type Favorite = z.infer<typeof Favorite>;

export const PlayerChampionSummaryResponse = z.object({
  assists_sum: z.number(),
  champion: z.string(),
  champion_id: z.number(),
  count: z.number(),
  cspm: z.number(),
  damage_dealt_to_objectives_sum: z.number(),
  damage_dealt_to_turrets_sum: z.number(),
  deaths_sum: z.number(),
  dpm: z.number(),
  dtpd: z.number(),
  dtpm: z.number(),
  gold_earned_sum: z.number(),
  gpm: z.number(),
  kda: z.number(),
  kills_sum: z.number(),
  losses: z.number(),
  minutes: z.number(),
  objective_dpm: z.number(),
  total_damage_dealt_to_champions_sum: z.number(),
  total_damage_taken_sum: z.number(),
  turret_dpm: z.number(),
  vspm: z.number(),
  wins: z.number(),
});

export type PlayerChampionSummaryResponse = z.infer<
  typeof PlayerChampionSummaryResponse
>;

export const SuspiciousPlayer = z.object({
  quick_ff_count: z.number(),
  total: z.number(),
});
export type SuspiciousPlayer = z.infer<typeof SuspiciousPlayer>;

export const BaseComment = z.object({
  created_date: z.string(),
  dislikes: z.number(),
  id: z.number(),
  likes: z.number(),
  markdown: z.string(),
  match: z.number(),
  modified_date: z.string(),
  summoner: Summoner,
  is_deleted: z.boolean(),
});

export const Comment = z.union([
  BaseComment,
  z.object({ reply_to: BaseComment }),
]);
export type Comment = z.infer<typeof Comment>;
