import * as t from 'io-ts'
import {isRight} from 'fp-ts/Either'
import reporter from 'io-ts-reporters'

// MATCH
export {
    BasicMatch,
    FullMatch,
    FullParticipant,
    BasicParticipant,
    SpectateMatch,
    AdvancedTimeline,
    Frame,
} from './iotypes/match'
export type {
    FullMatchType,
    FrameType,
    FullParticipantType,
    BuildingKillEventType,
    ChampionKillEventType,
    EliteMonsterKillEventType,
    TurretPlateDestroyedEventType,
    VictimDamageType,
    ItemPurchasedEventType,
    ItemUndoEventType,
    ItemDestroyedEventType,
    ItemSoldEventType,
    SimpleMatchType,
} from './iotypes/match'

// PLAYER
export {Summoner, PositionBin, TopPlayedWithPlayer, SummonerSearch} from './iotypes/player'
export type {SummonerType, PositionBinType, TopPlayedWithPlayerType, SummonerSearchType} from './iotypes/player'

export function unwrap<T>(x: t.Validation<T>) {
    if (isRight(x)) {
        return x.right
    }
    console.error('There was an error with the request.')
    const errors = reporter.report(x).join('\n')
    console.error(errors)
    throw new Error(reporter.report(x).join('\n'))
}

export type Regions =
    | 'na'
    | 'euw'
    | 'eune'
    | 'kr'
    | 'jp'
    | 'lan'
    | 'las'
    | 'br'
    | 'oce'
    | 'tr'
    | 'ru'
