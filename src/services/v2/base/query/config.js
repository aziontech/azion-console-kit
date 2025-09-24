export const CACHE_TIME = {
  ONE_MINUTE: 1 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000
}

export const CACHE_TYPE = {
  GLOBAL: 'GLOBAL',
  SENSITIVE: 'SENSITIVE',
  NONE: 'NONE'
}

export const DEFAULT_OPTIONS = {
  staleTime: CACHE_TIME.FIVE_MINUTES,
  gcTime: CACHE_TIME.THIRTY_MINUTES,
  refetchInterval: null
}
