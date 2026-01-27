import { toMilliseconds } from './config'

export const CACHE_TYPE = { STATIC: 'STATIC', GLOBAL: 'GLOBAL' }

const DEFAULT_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchOnMount: false,
  retry: false,
  persist: true,
  skipCache: false
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
  const cachePreset = { ...DEFAULT_OPTIONS, ...CACHE_PRESETS[CACHE_TYPE.GLOBAL] }
    
  if (cacheType && CACHE_PRESETS[cacheType]) {
    return { ...cachePreset, ...CACHE_PRESETS[cacheType] }
  }

  return cachePreset
}
