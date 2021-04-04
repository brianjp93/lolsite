import * as t from 'io-ts';
import { optional, maybe } from './base'


export const ItemImage = t.type({
    file: optional(t.string),
    file_15: optional(t.string),
    file_30: optional(t.string),
    file_40: optional(t.string),
})
export type ItemImageType = t.TypeOf<typeof ItemImage>


export const ChampionImage = t.type({
    file: optional(t.string),
    file_15: optional(t.string),
    file_30: optional(t.string),
    file_40: optional(t.string),
})
export type ChampionImageType = t.TypeOf<typeof ChampionImage>


export const BasicChampionWithImage = t.type({
    _id: t.string,
    name: t.string,
    image: ChampionImage,
})
export type BasicChampionWithImageType = t.TypeOf<typeof BasicChampionWithImage>
