import { toMilliseconds } from './config'

export const CACHE_TYPE = { STATIC: 'STATIC', GLOBAL: 'GLOBAL' }

const DEFAULT_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchOnMount: false,
  retry: 1
}

const CACHE_PRESETS = {
  [CACHE_TYPE.STATIC]: {
    staleTime: toMilliseconds({ minutes: 30 }),
    gcTime: toMilliseconds({ days: 1 })
  },
  [CACHE_TYPE.GLOBAL]: {
    staleTime: toMilliseconds({ minutes: 3 }),
    gcTime: toMilliseconds({ minutes: 5 })
  }
}

export const getCacheOptions = (cacheType = CACHE_TYPE.GLOBAL) => {
  if (!CACHE_PRESETS[cacheType]) {
    // eslint-disable-next-line no-console
    console.warn(
      `[TanStack Query] Invalid cacheType: "${cacheType}". Falling back to GLOBAL cache settings.`,
      `Valid types: ${Object.keys(CACHE_TYPE).join(', ')}`
    )
    return { ...DEFAULT_OPTIONS, ...CACHE_PRESETS[CACHE_TYPE.GLOBAL] }
  }

  return { ...DEFAULT_OPTIONS, ...CACHE_PRESETS[cacheType] }
}
