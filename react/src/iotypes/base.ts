import * as t from 'io-ts'

export function maybe(x: t.Mixed) {
  return t.union([x, t.undefined])
}

export function optional(x: t.Mixed) {
  return t.union([x, t.null])
}

export function PaginatedResponse<C extends t.Mixed>(codec: C) {
  return t.type({
    next: optional(t.string),
    previous: optional(t.string),
    count: t.number,
    results: t.array(codec),
  })
}
export type PaginatedResponseType<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
