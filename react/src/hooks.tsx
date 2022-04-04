import {useState, useEffect} from 'react'
import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
  QueryKey,
  QueryFunction,
  UseQueryResult,
} from 'react-query'
import api from './api/api'

import {ChampionType, UserType, RuneType, BasicChampionWithImageType} from './types'

export function useDebounce<V>(value: V, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler)
      }
    },
    [value, delay], // Only re-call effect if value or delay changes
  )
  return debouncedValue
}

export function useUser(): UserType | null {
  const userQuery = useQuery(
    'my-user',
    api.player.getMyUser,
    {retry: false, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 10}
  )
  return userQuery.data || null
}

export function useChampions(): Record<number, ChampionType> {
  const championQuery = useQuery(
    'champions',
    () => api.data.getChampions().then((x) => x.data.data),
    {retry: true, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 10},
  )
  let champions: Record<number, ChampionType> = {}
  for (let champ of championQuery.data || []) {
    champions[champ.key] = champ
  }
  return champions
}

export function useBasicChampions(): Record<number, BasicChampionWithImageType> {
  const championQuery = useQuery(
    'basic-champions',
    () => api.data.basicChampions().then((x) => x.results),
    {retry: true, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 10},
  )
  let champions: Record<number, BasicChampionWithImageType> = {}
  for (let champ of championQuery.data || []) {
    champions[champ.key] = champ
  }
  return champions
}

export function useRunes(version: string) {
  const runesQuery = useQuery(
    ['runes', version],
    () => api.data.getRunes({version}),
    {retry: false, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 60}
  )
  const runes: Record<number, RuneType> = {}
  for (const rune of runesQuery.data || []) {
    runes[rune._id] = rune
  }
  return runes
}

export function useQueryWithPrefetch<T>(
  key: QueryKey,
  request: QueryFunction<T>,
  prefetchKey: QueryKey,
  prefetchRequest: QueryFunction<T>,
  options: UseQueryOptions<T>,
): UseQueryResult<T, unknown> {
  const queryClient = useQueryClient()
  const matchQuery = useQuery(key, request, options)
  // prefetch next page
  queryClient.prefetchQuery(prefetchKey, prefetchRequest, {
    retry: options.retry,
    staleTime: options.staleTime,
  })
  return matchQuery
}
