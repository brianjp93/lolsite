import * as t from 'io-ts'
import {ItemImage, BasicChampionWithImage} from './data'
import {Position} from './player'
import {optional} from './base'

export const SimpleMatch = t.type({
  _id: t.string,
  game_creation: t.number,
  game_duration: t.number,
  game_mode: t.string,
  game_type: t.string,
  map_id: t.number,
  platform_id: t.string,
  season_id: optional(t.number),
  game_version: t.string,
  build: t.number,
  major: optional(t.number),
  minor: optional(t.number),
  patch: optional(t.number),
})
export type SimpleMatchType = t.TypeOf<typeof SimpleMatch>

export const BasicStats = t.type({
  kills: t.number,
  deaths: t.number,
  assists: t.number,
  champ_level: t.number,
  total_damage_dealt_to_champions: t.number,
  vision_score: t.number,
  total_damage_taken: t.number,
  damage_dealt_to_objectives: t.number,
  damage_dealt_to_turrets: t.number,
  gold_earned: t.number,
  total_heal: t.number,
  time_ccing_others: t.number,
  item_0_image: optional(ItemImage),
  item_1_image: optional(ItemImage),
  item_2_image: optional(ItemImage),
  item_3_image: optional(ItemImage),
  item_4_image: optional(ItemImage),
  item_5_image: optional(ItemImage),
  item_6_image: optional(ItemImage),
  perk_0_image_url: t.string,
  perk_sub_style_image_url: t.string,
})
export type BasicStatsType = t.TypeOf<typeof BasicStats>

export const BasicParticipant = t.type({
  _id: t.number,
  summoner_name: t.string,
  puuid: t.string,
  summoner_id: t.string,
  lane: t.string,
  role: t.string,
  team_id: t.number,
  summoner_1_id: t.number,
  summoner_1_image: t.string,
  summoner_2_id: t.number,
  summoner_2_image: t.string,
  champion: BasicChampionWithImage,
  stats: BasicStats,
})
export type BasicParticipantType = t.TypeOf<typeof BasicParticipant>

export const Team = t.type({
  _id: t.number,
  baron_kills: t.number,
  dragon_kills: t.number,
  first_baron: t.boolean,
  first_blood: t.boolean,
  first_dragon: t.boolean,
  first_inhibitor: t.boolean,
  first_rift_herald: t.boolean,
  first_tower: t.boolean,
  inhibitor_kills: t.number,
  rift_herald_kills: t.number,
  tower_kills: t.number,
  win: t.boolean,
})
export type TeamType = t.TypeOf<typeof Team>

export const BasicMatch = t.type({
  id: t.number,
  _id: t.number,
  game_duration: t.number,
  game_creation: t.number,
  queue_id: t.number,
  major: t.number,
  minor: t.number,
  participants: t.array(BasicParticipant),
  teams: t.array(Team),
})
export type BasicMatchType = t.TypeOf<typeof BasicMatch>

export const Stats = t.type({
  participant: t.number,
  assists: t.number,
  champ_level: t.number,
  damage_dealt_to_objectives: t.number,
  damage_dealt_to_turrets: t.number,
  damage_self_mitigated: t.number,
  deaths: t.number,
  double_kills: t.number,
  first_blood_assist: t.boolean,
  first_blood_kill: t.boolean,
  first_inhibitor_assist: t.boolean,
  first_inhibitor_kill: t.boolean,
  first_tower_assist: t.boolean,
  first_tower_kill: t.boolean,
  gold_earned: t.number,
  gold_spent: t.number,
  inhibitor_kills: t.number,
  item_0: t.number,
  item_1: t.number,
  item_2: t.number,
  item_3: t.number,
  item_4: t.number,
  item_5: t.number,
  item_6: t.number,
  killing_sprees: t.number,
  kills: t.number,
  largest_critical_strike: t.number,
  largest_killing_spree: t.number,
  largest_multi_kill: t.number,
  longest_time_spent_living: t.number,
  magic_damage_dealt: t.number,
  magic_damage_dealt_to_champions: t.number,
  magical_damage_taken: t.number,
  neutral_minions_killed: t.number,
  neutral_minions_killed_enemy_jungle: t.number,
  neutral_minions_killed_team_jungle: t.number,
  penta_kills: t.number,

  perk_0: t.number,
  perk_0_var_1: t.number,
  perk_0_var_2: t.number,
  perk_0_var_3: t.number,

  perk_1: t.number,
  perk_1_var_1: t.number,
  perk_1_var_2: t.number,
  perk_1_var_3: t.number,

  perk_2: t.number,
  perk_2_var_1: t.number,
  perk_2_var_2: t.number,
  perk_2_var_3: t.number,

  perk_3: t.number,
  perk_3_var_1: t.number,
  perk_3_var_2: t.number,
  perk_3_var_3: t.number,

  perk_4: t.number,
  perk_4_var_1: t.number,
  perk_4_var_2: t.number,
  perk_4_var_3: t.number,

  perk_5: t.number,
  perk_5_var_1: t.number,
  perk_5_var_2: t.number,
  perk_5_var_3: t.number,

  perk_primary_style: t.number,
  perk_sub_style: t.number,
  physical_damage_dealt: t.number,
  physical_damage_dealt_to_champions: t.number,
  physical_damage_taken: t.number,

  quadra_kills: t.number,
  sight_wards_bought_in_game: t.number,

  stat_perk_0: t.number,
  stat_perk_1: t.number,
  stat_perk_2: t.number,

  spell_1_casts: t.number,
  spell_2_casts: t.number,
  spell_3_casts: t.number,
  spell_4_casts: t.number,

  time_ccing_others: t.number,
  total_damage_dealt: t.number,
  total_damage_dealt_to_champions: t.number,
  total_damage_taken: t.number,
  total_heal: t.number,
  total_heals_on_teammates: t.number,
  total_damage_shielded_on_teammates: t.number,
  total_minions_killed: t.number,
  total_time_crowd_control_dealt: t.number,
  total_units_healed: t.number,
  triple_kills: t.number,
  true_damage_dealt: t.number,
  true_damage_dealt_to_champions: t.number,
  true_damage_taken: t.number,
  turret_kills: t.number,
  unreal_kills: t.number,
  vision_score: t.number,
  vision_wards_bought_in_game: t.number,
  wards_killed: t.number,
  wards_placed: t.number,
  detector_wards_placed: t.number,
  win: t.boolean,

  item_0_image: optional(ItemImage),
  item_1_image: optional(ItemImage),
  item_2_image: optional(ItemImage),
  item_3_image: optional(ItemImage),
  item_4_image: optional(ItemImage),
  item_5_image: optional(ItemImage),
  item_6_image: optional(ItemImage),
  perk_0_image_url: t.string,
  perk_sub_style_image_url: t.string,
})
export type StatsType = t.TypeOf<typeof Stats>

export const FullParticipant = t.type({
  id: t.number,
  match: t.number,
  _id: t.number,
  summoner_id: t.string,
  summoner_name: t.string,
  summoner_name_simplified: t.string,
  champion_id: t.number,
  summoner_1_id: t.number,
  summoner_1_casts: t.number,
  summoner_2_id: t.number,
  summoner_2_casts: t.number,
  team_id: t.number,
  puuid: t.string,
  lane: t.string,
  role: t.string,
  rank: optional(t.string),
  tier: optional(t.string),
  individual_position: optional(t.string),
  team_position: optional(t.string),
  role_label: optional(t.number),
  stats: Stats,
  champion: optional(BasicChampionWithImage),
  summoner_1_image: t.string,
  summoner_2_image: t.string,
})
export type FullParticipantType = t.TypeOf<typeof FullParticipant>

export const Ban = t.type({
  id: t.number,
  team: t.number,
  champion_id: t.number,
  pick_turn: t.number,
})
export type BanType = t.TypeOf<typeof Ban>

export const FullTeam = t.union([
  Team,
  t.type({
    id: t.number,
    bans: t.array(Ban),
    match: t.number,
  }),
])
export type FullTeamType = t.TypeOf<typeof FullTeam>

export const FullMatch = t.type({
  id: t.number,
  game_creation: t.number,
  game_duration: t.number,
  game_mode: t.string,
  game_type: t.string,
  map_id: t.number,
  platform_id: t.string,
  queue_id: t.number,
  season_id: t.number,
  game_version: t.string,
  major: t.number,
  minor: t.number,
  patch: t.number,
  participants: t.array(FullParticipant),
  teams: t.array(FullTeam),
})
export type FullMatchType = t.TypeOf<typeof FullMatch>

export const BannedChampion = t.type({
  championId: t.number,
  teamId: t.number,
  pickTurn: t.number,
})
export type BannedChampionType = t.TypeOf<typeof BannedChampion>

export const SpectateParticipant = t.type({
  bot: t.boolean,
  champion: BasicChampionWithImage,
  championId: t.number,
  gameCustomizationObjects: t.array(t.unknown),
  perks: t.type({
    perkIds: t.array(t.number),
    perkStyle: t.number,
    perkSubStyle: t.number,
  }),
  positions: t.array(Position),
  profileIconId: t.number,
  spell1Id: t.number,
  spell2Id: t.number,
  summonerId: t.string,
  summonerName: t.string,
  teamId: t.number,
})
export type SpectateParticipantType = t.TypeOf<typeof SpectateParticipant>

export const SpectateMatch = t.type({
  bannedChampions: t.array(BannedChampion),
  gameId: t.number,
  gameLength: t.number,
  gameMode: t.string,
  gameQueueConfigId: t.number,
  gameStartTime: t.number,
  gameType: t.string,
  mapId: t.number,
  observers: t.type({
    encryptionKey: t.string,
  }),
  participants: t.array(SpectateParticipant),
  platformId: t.string,
})
export type SpectateMatchType = t.TypeOf<typeof SpectateMatch>

export const ParticipantFrame = t.type({
  id: t.number,
  frame: t.number,
  participant_id: t.number,
  current_gold: t.number,
  jungle_minions_killed: t.number,
  level: t.number,
  minions_killed: t.number,
  team_score: t.number,
  total_gold: t.number,
  xp: t.number,
  x: t.number,
  y: t.number,
})
export type ParticipantFrameType = t.TypeOf<typeof ParticipantFrame>

export const WardKillEvent = t.type({
  timestamp: t.number,
  killer_id: t.number,
  ward_type: t.string,
  _type: t.literal('WARD_KILL'),
})
export type WardKillEventType = t.TypeOf<typeof WardKillEvent>

export const WardPlacedEvent = t.type({
  timestamp: t.number,
  creator_id: t.number,
  ward_type: t.string,
  _type: t.literal('WARD_PLACED'),
})
export type WardPlacedEventType = t.TypeOf<typeof WardPlacedEvent>

export const LevelUpEvent = t.type({
  timestamp: t.number,
  level: t.number,
  participant_id: t.number,
  _type: t.literal('LEVEL_UP'),
})
export type LevelUpEventType = t.TypeOf<typeof LevelUpEvent>

export const SkillLevelUpEvent = t.type({
  timestamp: t.number,
  level_up_type: t.string,
  participant_id: t.number,
  skill_slot: t.number,
  _type: t.literal('SKILL_LEVEL_UP'),
})
export type SkillLevelUpEventType = t.TypeOf<typeof SkillLevelUpEvent>

export const ItemPurchasedEvent = t.type({
  timestamp: t.number,
  item_id: t.number,
  participant_id: t.number,
  _type: t.literal('ITEM_PURCHASED'),
})
export type ItemPurchasedEventType = t.TypeOf<typeof ItemPurchasedEvent>

export const ItemDestroyedEvent = t.type({
  timestamp: t.number,
  item_id: t.number,
  participant_id: t.number,
  _type: t.literal('ITEM_DESTROYED'),
})
export type ItemDestroyedEventType = t.TypeOf<typeof ItemDestroyedEvent>

export const ItemSoldEvent = t.type({
  timestamp: t.number,
  item_id: t.number,
  participant_id: t.number,
  _type: t.literal('ITEM_SOLD'),
})
export type ItemSoldEventType = t.TypeOf<typeof ItemSoldEvent>

export const ItemUndoEvent = t.type({
  timestamp: t.number,
  participant_id: t.number,
  before_id: t.number,
  after_id: t.number,
  gold_gain: t.number,
  _type: t.literal('ITEM_UNDO'),
})
export type ItemUndoEventType = t.TypeOf<typeof ItemUndoEvent>

export const TurretPlateDestroyedEvent = t.type({
  timestamp: t.number,
  killer_id: t.number,
  lane_type: t.string,
  x: t.number,
  y: t.number,
  team_id: t.number,
  _type: t.literal('TURRET_PLATE_DESTROYED'),
})
export type TurretPlateDestroyedEventType = t.TypeOf<typeof TurretPlateDestroyedEvent>

export const EliteMonsterKillEvent = t.type({
  timestamp: t.number,
  killer_id: t.number,
  assisting_participant_ids: optional(t.array(t.number)),
  killer_team_id: t.number,
  monster_type: t.string,
  monster_sub_type: optional(t.string),
  x: t.number,
  y: t.number,
  _type: t.literal('ELITE_MONSTER_KILL'),
})
export type EliteMonsterKillEventType = t.TypeOf<typeof EliteMonsterKillEvent>

export const ChampionSpecialKillEvent = t.type({
  timestamp: t.number,
  assisting_participant_ids: optional(t.array(t.number)),
  killer_id: t.number,
  kill_type: t.string,
  multi_kill_length: optional(t.number),
  x: t.number,
  y: t.number,
  _type: t.literal('CHAMPION_SPECIAL_KILL'),
})
export type ChampionSpecialKillEventType = t.TypeOf<typeof ChampionSpecialKillEvent>

export const BuildingKillEvent = t.type({
  timestamp: t.number,
  assisting_participant_ids: optional(t.array(t.number)),
  building_type: t.string,
  killer_id: t.number,
  lane_type: t.string,
  x: t.number,
  y: t.number,
  team_id: t.number,
  tower_type: optional(t.string),
  _type: t.literal('BUILDING_KILL'),
})
export type BuildingKillEventType = t.TypeOf<typeof BuildingKillEvent>

export const VictimDamage = t.type({
  basic: t.boolean,
  magic_damage: t.number,
  name: t.string,
  participant_id: t.number,
  physical_damage: t.number,
  spell_name: t.string,
  spell_slot: t.number,
  true_damage: t.number,
  type: t.string,
})
export type VictimDamageType = t.TypeOf<typeof VictimDamage>

export const ChampionKillEvent = t.type({
  timestamp: t.number,
  bounty: t.number,
  kill_streak_length: t.number,
  killer_id: t.number,
  victim_id: t.number,
  x: t.number,
  y: t.number,

  victimdamagedealt_set: t.array(VictimDamage),
  victimdamagereceived_set: t.array(VictimDamage),
  _type: t.literal('CHAMPION_KILL'),
})
export type ChampionKillEventType = t.TypeOf<typeof ChampionKillEvent>

export const Frame = t.type({
  timestamp: t.number,
  participantframes: t.array(ParticipantFrame),

  wardkillevents: t.array(WardKillEvent),
  wardplacedevents: t.array(WardPlacedEvent),
  levelupevents: t.array(LevelUpEvent),
  skilllevelupevents: t.array(SkillLevelUpEvent),
  itempurchaseevents: t.array(ItemPurchasedEvent),
  itemdestroyedevents: t.array(ItemDestroyedEvent),
  itemundoevents: t.array(ItemUndoEvent),
  itemsoldevents: t.array(ItemSoldEvent),
  turretplatedestroyedevents: t.array(TurretPlateDestroyedEvent),
  elitemonsterkillevents: t.array(EliteMonsterKillEvent),
  championspecialkillevents: t.array(ChampionSpecialKillEvent),
  buildingkillevents: t.array(BuildingKillEvent),
  championkillevents: t.array(ChampionKillEvent),
})
export type FrameType = t.TypeOf<typeof Frame>

export const AdvancedTimeline = t.type({
  match: t.number,
  frame_interval: t.number,
  frames: t.array(Frame),
})
export type AdvancedTimelineType = t.TypeOf<typeof AdvancedTimeline>
