import { z } from "zod";

export const ItemImage = z.object({
  file: z.string().optional(),
  file_15: z.string().nullable(),
  file_30: z.string().nullable(),
  file_40: z.string().nullable(),
});
export type ItemImageType = z.infer<typeof ItemImage>;

export const ItemGold = z.object({
  id: z.number(),
  base: z.number(),
  purchasable: z.boolean(),
  sell: z.number(),
  total: z.number(),
  item: z.number(),
});

export const StatEfficiency = z.record(z.object({
  amount: z.number(),
  gold_value: z.number(),
}).or(z.number()))

export const SimpleItem = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  _id: z.number(),
  gold: ItemGold,
  image: ItemImage,
});
export type SimpleItem = z.infer<typeof SimpleItem>;

export const Item = z.object({
  id: z.number(),
  gold: ItemGold,
  image: ItemImage,
  stats: z.record(z.number().nullable()),
  maps: z.record(z.boolean()),
  major: z.number(),
  minor: z.number(),
  patch: z.number(),
  _id: z.number(),
  version: z.string(),
  language: z.string(),
  colloq: z.string(),
  description: z.string(),
  name: z.string(),
  plaintext: z.string(),
  required_ally: z.string(),
  required_champion: z.string(),
  in_store: z.boolean(),
  consumed: z.boolean(),
  consume_on_full: z.boolean(),
  stacks: z.number().nullable(),
  last_changed: z.string().nullable(),
  diff: z.record(z.object({
    prev: z.string().or(z.number()).nullable(),
    curr: z.string().or(z.number()).nullable(),
  })).nullable(),
  stat_efficiency: StatEfficiency,
});
export type ItemType = z.infer<typeof Item>;

export const ChampionImage = z.object({
  file: z.string().nullable(),
  file_15: z.string().nullable(),
  file_30: z.string().nullable(),
  file_40: z.string().nullable(),
});
export type ChampionImageType = z.infer<typeof ChampionImage>;

export const BasicChampionWithImage = z.object({
  _id: z.string(),
  name: z.string(),
  key: z.number(),
  image: ChampionImage,
});
export type BasicChampionWithImageType = z.infer<
  typeof BasicChampionWithImage
>;

export const Champion = z.object({
  image: ChampionImage,
  stats: z.unknown(),
  spells: z.unknown(),
  _id: z.string(),
  version: z.string(),
  language: z.string(),
  key: z.number(),
  name: z.string(),
  partype: z.string(),
  title: z.string(),
  lore: z.string(),
  last_changed: z.string(),
  created_date: z.string(),
});
export type ChampionType = z.infer<typeof Champion>;

export const Rune = z.object({
  icon: z.string(),
  id: z.number(),
  image_url: z.string(),
  key: z.string(),
  long_description: z.string(),
  name: z.string(),
  reforgedtree: z.number(),
  row: z.number(),
  short_description: z.string(),
  sort_int: z.number(),
  _id: z.number(),
});
export type RuneType = z.infer<typeof Rune>;

export const Queue = z.object({
  _id: z.number(),
  _map: z.string(),
  description: z.string(),
});
export type QueueType = z.infer<typeof Queue>;
