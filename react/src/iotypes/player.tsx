import * as t from 'io-ts';
import { optional } from './base'


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
