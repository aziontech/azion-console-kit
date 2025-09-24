export const CACHE_TYPE = {
  GLOBAL: 'GLOBAL',
  SENSITIVE: 'SENSITIVE',
  NONE: 'NONE'
}

export const CACHE_TIME = {
  ONE_MINUTE: 60 * 1000,
  THREE_MINUTES: 3 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000
}

export const DEFAULT_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: CACHE_TIME.FIVE_MINUTES,
  gcTime: CACHE_TIME.THIRTY_MINUTES
}

export const SENSITIVE_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 0,
  staleTime: CACHE_TIME.THREE_MINUTES,
  gcTime: CACHE_TIME.THREE_MINUTES
}
