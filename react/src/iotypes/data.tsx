import * as t from 'io-ts';
import { optional } from './base'


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


export const Champion = t.type({
  image: ChampionImage,
  stats: t.unknown,
  spells: t.unknown,
  _id: t.string,
  version: t.string,
  language: t.string,
  key: t.number,
  name: t.string,
  partype: t.string,
  title: t.string,
  lore: t.string,
  last_changed: t.string,
  created_date: t.string,
})
export type ChampionType = t.TypeOf<typeof Champion>

export const Rune = t.type({
  icon: t.string,
  id: t.number,
  image_url: t.string,
  key: t.string,
  long_description: t.string,
  name: t.string,
  reforgedtree: t.number,
  row: t.number,
  short_description: t.string,
  sort_int: t.number,
  _id: t.number,
})
export type RuneType = t.TypeOf<typeof Rune>
