import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import api from './api/api'

import { ChampionType } from './types'


export function useDebounce<V>(value: V, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}


export function useChampions(): Record<number, ChampionType> {
  const championQuery = useQuery(
    'champions',
    () => api.data.getChampions().then(x => x.data.data),
    {retry: false, refetchOnWindowFocus: false, staleTime: 1000 * 60 * 10}
  )
  let champions: Record<number, ChampionType> = {}
  for (let champ of (championQuery.data || [])) {
    champions[champ.key] = champ
  }
  return champions
}
