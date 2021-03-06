import * as t from 'io-ts'
import {isRight} from 'fp-ts/Either'
import reporter from 'io-ts-reporters'
export {
    BasicMatch,
    FullMatch,
    FullParticipant,
    BasicParticipant,
    SpectateMatch,
    TimelineEvent,
    AdvancedTimeline,
    Frame,
} from './iotypes/match'

export type {TimelineEventType, FrameType, FullParticipantType} from './iotypes/match'

export {Summoner, PositionBin, TopPlayedWithPlayer} from './iotypes/player'

export type {SummonerType, PositionBinType, TopPlayedWithPlayerType} from './iotypes/player'

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
