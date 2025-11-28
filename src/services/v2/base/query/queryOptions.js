import { toMilliseconds } from './config'

export const CACHE_TYPE = { GLOBAL: 'GLOBAL', SENSITIVE: 'SENSITIVE', PAGE_LIST: 'PAGE_LIST' }

const DEFAULT_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1
}

const CACHE_PRESETS = {
  [CACHE_TYPE.GLOBAL]: {
    staleTime: toMilliseconds({ minutes: 30 }),
    gcTime: toMilliseconds({ days: 1 }),
    retry: 3
  },
  [CACHE_TYPE.SENSITIVE]: {
    staleTime: toMilliseconds({ minutes: 3 }),
    gcTime: toMilliseconds({ minutes: 5 }),
    retry: 1
  },
  [CACHE_TYPE.PAGE_LIST]: {
    staleTime: toMilliseconds({ minutes: 5 }),
    gcTime: toMilliseconds({ minutes: 5 }),
    retry: 1
  }
}

export const getCacheOptions = (cacheType = CACHE_TYPE.GLOBAL) => {
  return { ...DEFAULT_OPTIONS, ...CACHE_PRESETS[cacheType] }
}
