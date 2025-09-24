export const TIME = {
  // Basic units
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,

  // TanStack Query defaults
  QUERY_STALE_5_MINUTES: 5 * 60 * 1000, // 5 minutes
  QUERY_GC_10_MINUTES: 10 * 60 * 1000, // 10 minutes

  // Cache TTL - Generic durations
  CACHE_1_MINUTE: 1 * 60 * 1000, // 1 minute
  CACHE_3_MINUTES: 3 * 60 * 1000, // 3 minutes
  CACHE_5_MINUTES: 5 * 60 * 1000, // 5 minutes
  CACHE_30_MINUTES: 30 * 60 * 1000, // 30 minutes
  CACHE_1_HOUR: 1 * 60 * 60 * 1000, // 1 hour
  CACHE_6_HOURS: 6 * 60 * 60 * 1000, // 6 hours
  CACHE_12_HOURS: 12 * 60 * 60 * 1000, // 12 hours
  CACHE_24_HOURS: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_48_HOURS: 48 * 60 * 60 * 1000, // 48 hours
  CACHE_72_HOURS: 72 * 60 * 60 * 1000 // 72 hours
}

export const RETRY = {
  RETRY_0_TIMES: 0,
  RETRY_1_TIME: 1,
  RETRY_2_TIMES: 2,
  RETRY_3_TIMES: 3,
  RETRY_5_TIMES: 5
}

export const CACHE_TYPE = {
  GLOBAL: 'global',
  SENSITIVE: 'sensitive',
  DEFAULT: 'default'
}
