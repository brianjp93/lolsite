import { z } from 'zod'
import {BasicChampionWithImage} from './data'
import {Position} from './player'

export const MajorPatch = z.object({
  major: z.number(),
  version: z.string(),
});

export const MajorPatchesResponse = z.object({
  results: z.array(MajorPatch),
});

export type MajorPatch = z.infer<typeof MajorPatch>;
export type MajorPatchesResponse = z.infer<typeof MajorPatchesResponse>;

export const SimpleMatch = z.object({
  id: z.number(),
  _id: z.string(),
  game_creation: z.number(),
  game_duration: z.number(),
  game_mode: z.string(),
  game_type: z.string(),
  map_id: z.number(),
  platform_id: z.string(),
  season_id: z.number().nullable(),
  game_version: z.string(),
  build: z.number(),
  major: z.number().nullable(),
  minor: z.number().nullable(),
  patch: z.number().nullable(),
  queue_id: z.number(),
}).transform(obj => {
  return {
    ...obj,
    game_duration_minutes: obj.game_duration / 60000,
  }
})
export type SimpleMatchType = z.infer<typeof SimpleMatch>

export const BasicStats = z.object({
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  champ_level: z.number(),
  total_damage_dealt_to_champions: z.number(),
  vision_score: z.number(),
  total_damage_taken: z.number(),
  damage_dealt_to_objectives: z.number(),
  damage_dealt_to_turrets: z.number(),
  gold_earned: z.number(),
  total_heal: z.number(),
  time_ccing_others: z.number(),
  item_0: z.number().nullable(),
  item_1: z.number().nullable(),
  item_2: z.number().nullable(),
  item_3: z.number().nullable(),
  item_4: z.number().nullable(),
  item_5: z.number().nullable(),
  item_6: z.number().nullable(),
  perk_0_image_url: z.string(),
  perk_sub_style_image_url: z.string(),
})
export type BasicStatsType = z.infer<typeof BasicStats>

export const BasicParticipant = z.object({
  _id: z.number(),
  puuid: z.string(),
  lane: z.string(),
  role: z.string(),
  team_id: z.number(),
  riot_id_name: z.string(),
  riot_id_tagline: z.string(),
  summoner_1_id: z.number(),
  summoner_1_image: z.string(),
  summoner_2_id: z.number(),
  summoner_2_image: z.string(),
  champion_id: z.number(),
  stats: BasicStats,
  team_position: z.string().nullable(),
  placement: z.number(),
  subteam_placement: z.number(),
  role_bound_item: z.number().nullable(),
  impact_score: z.number(),
  impact_rank: z.number(),
})
export type BasicParticipantType = z.infer<typeof BasicParticipant>

export const Team = z.object({
  _id: z.number(),
  win: z.boolean(),
})
export type TeamType = z.infer<typeof Team>

export const BasicMatch = z.object({
  id: z.number(),
  _id: z.string(),
  game_duration: z.number(),
  game_creation: z.number(),
  queue_id: z.number(),
  major: z.number(),
  minor: z.number(),
  participants: z.array(BasicParticipant),
  teams: z.array(Team),
})
export type BasicMatchType = z.infer<typeof BasicMatch>

export const Stats = z.object({
  participant: z.number(),
  assists: z.number(),
  champ_level: z.number(),
  damage_dealt_to_objectives: z.number(),
  damage_dealt_to_turrets: z.number(),
  damage_self_mitigated: z.number(),
  deaths: z.number(),
  double_kills: z.number(),
  first_blood_assist: z.boolean(),
  first_blood_kill: z.boolean(),
  first_tower_assist: z.boolean(),
  first_tower_kill: z.boolean(),
  gold_earned: z.number(),
  gold_spent: z.number(),
  inhibitor_kills: z.number(),
  item_0: z.number(),
  item_1: z.number(),
  item_2: z.number(),
  item_3: z.number(),
  item_4: z.number(),
  item_5: z.number(),
  item_6: z.number(),
  kills: z.number(),
  largest_multi_kill: z.number(),
  magic_damage_dealt: z.number(),
  magic_damage_dealt_to_champions: z.number(),
  magical_damage_taken: z.number(),
  neutral_minions_killed: z.number(),
  penta_kills: z.number(),

  perk_0: z.number(),
  perk_0_var_1: z.number(),
  perk_0_var_2: z.number(),
  perk_0_var_3: z.number(),

  perk_1: z.number(),
  perk_1_var_1: z.number(),
  perk_1_var_2: z.number(),
  perk_1_var_3: z.number(),

  perk_2: z.number(),
  perk_2_var_1: z.number(),
  perk_2_var_2: z.number(),
  perk_2_var_3: z.number(),

  perk_3: z.number(),
  perk_3_var_1: z.number(),
  perk_3_var_2: z.number(),
  perk_3_var_3: z.number(),

  perk_4: z.number(),
  perk_4_var_1: z.number(),
  perk_4_var_2: z.number(),
  perk_4_var_3: z.number(),

  perk_5: z.number(),
  perk_5_var_1: z.number(),
  perk_5_var_2: z.number(),
  perk_5_var_3: z.number(),

  perk_primary_style: z.number(),
  perk_sub_style: z.number(),
  physical_damage_dealt: z.number(),
  physical_damage_dealt_to_champions: z.number(),
  physical_damage_taken: z.number(),

  quadra_kills: z.number(),

  stat_perk_0: z.number(),
  stat_perk_1: z.number(),
  stat_perk_2: z.number(),

  spell_1_casts: z.number(),
  spell_2_casts: z.number(),
  spell_3_casts: z.number(),
  spell_4_casts: z.number(),

  time_ccing_others: z.number(),
  total_damage_dealt: z.number(),
  total_damage_dealt_to_champions: z.number(),
  total_damage_taken: z.number(),
  total_heal: z.number(),
  total_heals_on_teammates: z.number(),
  total_damage_shielded_on_teammates: z.number(),
  total_minions_killed: z.number(),
  total_time_crowd_control_dealt: z.number(),
  total_units_healed: z.number(),
  total_ally_jungle_minions_killed: z.number(),
  total_enemy_jungle_minions_killed: z.number(),
  triple_kills: z.number(),
  true_damage_dealt: z.number(),
  true_damage_dealt_to_champions: z.number(),
  true_damage_taken: z.number(),
  vision_score: z.number(),
  vision_wards_bought_in_game: z.number(),
  wards_killed: z.number(),
  wards_placed: z.number(),
  win: z.boolean(),

  perk_0_image_url: z.string(),
  perk_sub_style_image_url: z.string(),

  all_in_pings: z.number(),
  assist_me_pings: z.number(),
  bait_pings: z.number(),
  basic_pings: z.number(),
  command_pings: z.number(),
  danger_pings: z.number(),
  enemy_missing_pings: z.number(),
  enemy_vision_pings: z.number(),
  get_back_pings: z.number(),
  hold_pings: z.number(),
  need_vision_pings: z.number(),
  on_my_way_pings: z.number(),
  push_pings: z.number(),
  vision_cleared_pings: z.number(),
}).transform(obj => {
  return {
    ...obj,
    cs: obj.total_minions_killed + obj.neutral_minions_killed,
    dtpd: obj.total_damage_taken / (obj.deaths || 1),
    dpd: obj.total_damage_dealt_to_champions / (obj.deaths || 1),
    dpg: obj.total_damage_dealt_to_champions / obj.gold_earned,
  }
})
export type StatsType = z.infer<typeof Stats>

export const FullParticipant = z.object({
  id: z.number(),
  match: z.number(),
  _id: z.number(),
  champion_id: z.number(),
  champ_experience: z.number().nullable(),
  summoner_1_id: z.number(),
  summoner_1_casts: z.number(),
  summoner_2_id: z.number(),
  summoner_2_casts: z.number(),
  team_id: z.number(),
  puuid: z.string(),
  lane: z.string(),
  role: z.string(),
  rank: z.string().nullable(),
  tier: z.string().nullable(),
  individual_position: z.string().nullable(),
  team_position: z.string().nullable(),
  role_label: z.number().nullable(),
  role_bound_item: z.number().nullable(),
  stats: Stats,
  summoner_1_image: z.string(),
  summoner_2_image: z.string(),
  placement: z.number(),
  subteam_placement: z.number(),
  riot_id_name: z.string(),
  riot_id_tagline: z.string(),
  impact_score: z.number(),
  impact_rank: z.number(),
})
export type FullParticipantType = z.infer<typeof FullParticipant>

export const Ban = z.object({
  team: z.number(),
  champion_id: z.number(),
  pick_turn: z.number(),
})
export type BanType = z.infer<typeof Ban>

export const FullTeam = z.union([
  Team,
  z.object({
    id: z.number(),
    bans: z.array(Ban),
  }),
])
export type FullTeamType = z.infer<typeof FullTeam>

export const FullMatch = z.object({
  id: z.number(),
  _id: z.string(),
  game_creation: z.number(),
  game_duration: z.number(),
  game_mode: z.string(),
  game_type: z.string(),
  map_id: z.number(),
  platform_id: z.string(),
  queue_id: z.number(),
  season_id: z.number(),
  game_version: z.string(),
  major: z.number(),
  minor: z.number(),
  patch: z.number(),
  participants: z.array(FullParticipant),
  teams: z.array(FullTeam),
}).transform(obj => {
  return {
    ...obj,
    game_duration_minutes: obj.game_duration / 60000,
  }
})
export type FullMatchType = z.infer<typeof FullMatch>

export const BannedChampion = z.object({
  championId: z.number(),
  teamId: z.number(),
  pickTurn: z.number(),
})
export type BannedChampionType = z.infer<typeof BannedChampion>

export const SpectateParticipant = z.object({
  bot: z.boolean(),
  champion: BasicChampionWithImage.optional(),
  championId: z.number(),
  gameCustomizationObjects: z.array(z.unknown()),
  perks: z.object({
    perkIds: z.array(z.number()),
    perkStyle: z.number(),
    perkSubStyle: z.number(),
  }).nullable(),
  positions: z.array(Position).nullable(),
  profileIconId: z.number(),
  spell1Id: z.number(),
  spell2Id: z.number(),
  teamId: z.number(),
  riotId: z.string(),
  puuid: z.string(),
})
export type SpectateParticipantType = z.infer<typeof SpectateParticipant>

export const SimpleSpectateParticipant = z.object({
  teamId: z.number(),
  spell1Id: z.number(),
  spell2Id: z.number(),
  championId: z.number(),
  profileIconId: z.number(),
  riotId: z.string(),
  puuid: z.string(),
  bot: z.boolean(),
  gameCustomizationObjects: z.array(z.unknown()),
  perks: z.object({
      perkIds: z.array(z.number()),
      perkStyle: z.number(),
      perkSubStyle: z.number()
  }),
})

export const SpectateMatch = z.object({
  bannedChampions: z.array(BannedChampion),
  gameId: z.number(),
  gameLength: z.number(),
  gameMode: z.string(),
  gameQueueConfigId: z.number(),
  gameStartTime: z.number(),
  gameType: z.string(),
  mapId: z.number(),
  observers: z.object({
    encryptionKey: z.string(),
  }),
  participants: z.array(SpectateParticipant),
  platformId: z.string(),
})
export type SpectateMatchType = z.infer<typeof SpectateMatch>

export const SimpleSpectate = z.object({
  bannedChampions: z.array(BannedChampion),
  gameId: z.number(),
  gameLength: z.number(),
  gameMode: z.string(),
  gameQueueConfigId: z.number(),
  gameStartTime: z.number(),
  gameType: z.string(),
  mapId: z.number(),
  observers: z.object({
    encryptionKey: z.string(),
  }),
  participants: z.array(SimpleSpectateParticipant),
  platformId: z.string(),
})
export type SimpleSpectate = z.infer<typeof SimpleSpectate>;

export const ParticipantFrame = z.object({
  participant_id: z.number(),
  current_gold: z.number(),
  gold_per_second: z.number(),
  jungle_minions_killed: z.number(),
  level: z.number(),
  minions_killed: z.number(),
  team_score: z.number(),
  total_gold: z.number(),
  time_enemy_spent_controlled: z.number(),
  xp: z.number(),
  x: z.number(),
  y: z.number(),

  ability_haste: z.number(),
  ability_power: z.number(),
  armor: z.number(),
  armor_pen: z.number(),
  armor_pen_percent: z.number(),
  attack_damage: z.number(),
  attack_speed: z.number(),
  bonus_armor_pen_percent: z.number(),
  bonus_magic_pen_percent: z.number(),
  cc_reduction: z.number(),
  health: z.number(),
  health_max: z.number(),
  health_regen: z.number(),
  lifesteal: z.number(),
  magic_pen: z.number(),
  magic_pen_percent: z.number(),
  magic_resist: z.number(),
  movement_speed: z.number(),
  omnivamp: z.number(),
  physical_vamp: z.number(),
  power: z.number(),
  power_max: z.number(),
  power_regen: z.number(),
  spell_vamp: z.number(),

  magic_damage_done: z.number(),
  magic_damage_done_to_champions: z.number(),
  magic_damage_taken: z.number(),
  physical_damage_done: z.number(),
  physical_damage_done_to_champions: z.number(),
  physical_damage_taken: z.number(),
  total_damage_done: z.number(),
  total_damage_done_to_champions: z.number(),
  total_damage_taken: z.number(),
  true_damage_done: z.number(),
  true_damage_done_to_champions: z.number(),
  true_damage_taken: z.number(),
}).transform(obj => {
  return {
    ...obj,
    cs: obj.minions_killed + obj.jungle_minions_killed,
  }
})
export type ParticipantFrameType = z.infer<typeof ParticipantFrame>

export const WardKillEvent = z.object({
  timestamp: z.number(),
  killer_id: z.number(),
  ward_type: z.string(),
  _type: z.literal('WARD_KILL'),
})
export type WardKillEventType = z.infer<typeof WardKillEvent>

export const WardPlacedEvent = z.object({
  timestamp: z.number(),
  creator_id: z.number(),
  ward_type: z.string(),
  _type: z.literal('WARD_PLACED'),
})
export type WardPlacedEventType = z.infer<typeof WardPlacedEvent>

export const LevelUpEvent = z.object({
  timestamp: z.number(),
  level: z.number(),
  participant_id: z.number(),
  _type: z.literal('LEVEL_UP'),
})
export type LevelUpEventType = z.infer<typeof LevelUpEvent>

export const SkillLevelUpEvent = z.object({
  timestamp: z.number(),
  level_up_type: z.string(),
  participant_id: z.number(),
  skill_slot: z.number(),
  _type: z.literal('SKILL_LEVEL_UP'),
})
export type SkillLevelUpEventType = z.infer<typeof SkillLevelUpEvent>

export const ItemPurchasedEvent = z.object({
  timestamp: z.number(),
  item_id: z.number(),
  participant_id: z.number(),
  _type: z.literal('ITEM_PURCHASED'),
})
export type ItemPurchasedEventType = z.infer<typeof ItemPurchasedEvent>

export const ItemDestroyedEvent = z.object({
  timestamp: z.number(),
  item_id: z.number(),
  participant_id: z.number(),
  _type: z.literal('ITEM_DESTROYED'),
})
export type ItemDestroyedEventType = z.infer<typeof ItemDestroyedEvent>

export const ItemSoldEvent = z.object({
  timestamp: z.number(),
  item_id: z.number(),
  participant_id: z.number(),
  _type: z.literal('ITEM_SOLD'),
})
export type ItemSoldEventType = z.infer<typeof ItemSoldEvent>

export const ItemUndoEvent = z.object({
  timestamp: z.number(),
  participant_id: z.number(),
  before_id: z.number(),
  after_id: z.number(),
  gold_gain: z.number(),
  _type: z.literal('ITEM_UNDO'),
})
export type ItemUndoEventType = z.infer<typeof ItemUndoEvent>

export const TurretPlateDestroyedEvent = z.object({
  timestamp: z.number(),
  killer_id: z.number(),
  lane_type: z.string(),
  x: z.number(),
  y: z.number(),
  team_id: z.number(),
  _type: z.literal('TURRET_PLATE_DESTROYED'),
})
export type TurretPlateDestroyedEventType = z.infer<typeof TurretPlateDestroyedEvent>

export const EliteMonsterKillEvent = z.object({
  bounty: z.number(),
  timestamp: z.number(),
  killer_id: z.number(),
  assisting_participant_ids: z.array(z.number()).nullable(),
  killer_team_id: z.number(),
  monster_type: z.string(),
  monster_sub_type: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  _type: z.literal('ELITE_MONSTER_KILL'),
})
export type EliteMonsterKillEventType = z.infer<typeof EliteMonsterKillEvent>

export const ChampionSpecialKillEvent = z.object({
  timestamp: z.number(),
  assisting_participant_ids: z.array(z.number()).nullable(),
  killer_id: z.number(),
  kill_type: z.string(),
  multi_kill_length: z.number().nullable(),
  x: z.number(),
  y: z.number(),
  _type: z.literal('CHAMPION_SPECIAL_KILL'),
})
export type ChampionSpecialKillEventType = z.infer<typeof ChampionSpecialKillEvent>

export const BuildingKillEvent = z.object({
  timestamp: z.number(),
  assisting_participant_ids: z.array(z.number()).nullable(),
  building_type: z.string(),
  bounty: z.number(),
  killer_id: z.number(),
  lane_type: z.string(),
  x: z.number(),
  y: z.number(),
  team_id: z.number(),
  tower_type: z.string().nullable(),
  _type: z.literal('BUILDING_KILL'),
})
export type BuildingKillEventType = z.infer<typeof BuildingKillEvent>

export const VictimDamage = z.object({
  basic: z.boolean(),
  magic_damage: z.number(),
  name: z.string(),
  participant_id: z.number(),
  physical_damage: z.number(),
  spell_name: z.string(),
  spell_slot: z.number(),
  true_damage: z.number(),
  type: z.string(),
})
export type VictimDamageType = z.infer<typeof VictimDamage>

export const ChampionKillEvent = z.object({
  timestamp: z.number(),
  bounty: z.number(),
  shutdown_bounty: z.number(),
  kill_streak_length: z.number(),
  killer_id: z.number(),
  victim_id: z.number(),
  x: z.number(),
  y: z.number(),

  victimdamagedealt_set: z.array(VictimDamage),
  victimdamagereceived_set: z.array(VictimDamage),
  _type: z.literal('CHAMPION_KILL'),
})
export type ChampionKillEventType = z.infer<typeof ChampionKillEvent>

export const Frame = z.object({
  timestamp: z.number(),
  participantframes: z.array(ParticipantFrame),

  wardkillevents: z.array(WardKillEvent),
  wardplacedevents: z.array(WardPlacedEvent),
  levelupevents: z.array(LevelUpEvent),
  skilllevelupevents: z.array(SkillLevelUpEvent),
  itempurchaseevents: z.array(ItemPurchasedEvent),
  itemdestroyedevents: z.array(ItemDestroyedEvent),
  itemundoevents: z.array(ItemUndoEvent),
  itemsoldevents: z.array(ItemSoldEvent),
  turretplatedestroyedevents: z.array(TurretPlateDestroyedEvent),
  elitemonsterkillevents: z.array(EliteMonsterKillEvent),
  championspecialkillevents: z.array(ChampionSpecialKillEvent),
  buildingkillevents: z.array(BuildingKillEvent),
  championkillevents: z.array(ChampionKillEvent),
})
export type FrameType = z.infer<typeof Frame>

export const BountiesReceived = z.object({
  monster_bounty: z.number(),
  champion_kill_bounty: z.number(),
  champion_kill_gold: z.number(),
  champion_assist_gold: z.number(),
  building_bounty: z.number(),
  total_bounty_received: z.number(),
  champion_kill_bounty_given: z.number(),
  champion_kill_gold_given: z.number(),
  champion_assist_gold_given: z.number(),
  total_gold_given: z.number(),
})
export type BountiesReceivedType = z.infer<typeof BountiesReceived>

export const AdvancedTimeline = z.object({
  frame_interval: z.number(),
  frames: z.array(Frame),
  bounties: z.record(z.string(), BountiesReceived),
  team_bounties: z.record(z.string(), z.number()),
})
export type AdvancedTimelineType = z.infer<typeof AdvancedTimeline>

export const MatchSummary = z.object({
  content: z.string(),
  status: z.string(),
})
export type MatchSummaryType = z.infer<typeof MatchSummary>
