/**
 * Maps HTTP status code bucket labels (e.g. '2xx') to their numeric range
 * [min, max). Used by the legend click-to-filter feature on the Events
 * histogram when the chart is stacked by `status`.
 */
export const STATUS_BUCKET_RANGES = {
  '2xx': [200, 300],
  '3xx': [300, 400],
  '4xx': [400, 500],
  '5xx': [500, 600]
}

/**
 * Maps a Metrics chart key + clicked legend bucket to one or more concrete
 * filters on the underlying Events dataset. Two shapes:
 *   • 'pivot-<field>' → the bucket label itself becomes the filter value
 *     for <field> (used when the chart was built via groupBy pivot).
 *   • { <seriesName>: [{ field, value }, ...] } → fixed (field, value)
 *     pairs appended when the user clicks that series.
 */
export const METRICS_LEGEND_FILTERS = {
  wafThreats: {
    wafRequestsAllowed: [
      { field: 'wafBlock', value: '0' },
      { field: 'wafLearning', value: '0' }
    ],
    wafRequestsThreat: [{ field: 'wafLearning', value: '1' }],
    wafRequestsBlocked: [{ field: 'wafBlock', value: '1' }]
  },
  wafXss: { wafRequestsXssAttacks: [{ field: 'wafAttackFamily', value: '$XSS' }] },
  wafRfi: { wafRequestsRfiAttacks: [{ field: 'wafAttackFamily', value: '$RFI' }] },
  wafSql: { wafRequestsSqlAttacks: [{ field: 'wafAttackFamily', value: '$SQL' }] },
  wafOther: { wafRequestsOthersAttacks: [{ field: 'wafAttackFamily', value: '$OTHERS' }] },
  wafThreatsByHost: 'pivot-host',
  botTraffic: 'pivot-classified',
  botCaptcha: 'pivot-challengeSolved',
  cacheHitMiss: 'pivot-upstreamCacheStatus',
  tieredCacheHitMiss: 'pivot-upstreamCacheStatus'
}
