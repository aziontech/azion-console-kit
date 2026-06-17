/**
 * Curated dataset field lists — single source of truth for which fields the
 * Real-Time Events experience knows to exist per dataset.
 *
 * Source (authoritative): Azion docs MDX
 *   https://github.com/aziontech/docs/blob/main/src/content/docs/en/pages/devtools/api-graphql/features/events-fields.mdx
 *   https://github.com/aziontech/docs/blob/main/src/content/docs/en/pages/devtools/api-graphql/features/metrics-fields.mdx
 *
 * Each array mirrors — exactly in casing and order — the "Field" column of
 * the corresponding dataset's table in the docs. No inference, no repo-wide
 * extraction: if a field isn't in the docs it doesn't belong here.
 *
 * Runtime self-healing (intentional):
 *   1. Introspection (see `src/modules/filter-loaders/dataset-fields-loader.js`)
 *      overwrites the in-memory cache per dataset on first selection so any
 *      docs↔API drift is corrected transparently.
 *   2. The chunker (`merge-field-chunks.js`) strips fields reported as
 *      "Cannot query field X" from the chunk and retries once, so a single
 *      drifted name never breaks the page load.
 */

export const CURATED_DATASET_FIELDS = Object.freeze({
  // ── Applications, WAF ──
  workloadEvents: Object.freeze([
    'bytesSent',
    'configurationId',
    'debugLog',
    'geolocAsn',
    'geolocCountryName',
    'geolocRegionName',
    'host',
    'httpReferer',
    'httpUserAgent',
    'proxyStatus',
    'requestId',
    'requestLength',
    'requestMethod',
    'requestTime',
    'requestUri',
    'remoteAddress',
    'remotePort',
    'scheme',
    'serverProtocol',
    'sentHttpContentType',
    'sentHttpXOriginalImageSize',
    'sessionId',
    'serverAddr',
    'serverPort',
    'solutionId',
    'sslCipher',
    'sslProtocol',
    'sslServerName',
    'sslSessionReused',
    'stacktrace',
    'status',
    'streamName',
    'tcpinfoRtt',
    'ts',
    'upstreamAddr',
    'upstreamAddrStr',
    'upstreamBytesReceived',
    'upstreamBytesReceivedStr',
    'upstreamBytesSent',
    'upstreamBytesSentStr',
    'upstreamCacheStatus',
    'upstreamConnectTime',
    'upstreamConnectTimeStr',
    'upstreamHeaderTime',
    'upstreamHeaderTimeStr',
    'upstreamResponseTime',
    'upstreamResponseTimeStr',
    'upstreamStatus',
    'upstreamStatusStr',
    'virtualhostId',
    'wafAttackFamily',
    'wafBlock',
    'wafEvheaders',
    'wafLearning',
    'wafMatch',
    'wafScore',
    'wafTotalBlocked',
    'wafTotalProcessed'
  ]),

  // ── Functions ──
  functionEvents: Object.freeze([
    'configurationId',
    'edgeFunctionsInstanceIdList',
    'edgeFunctionsInitiatorTypeList',
    'edgeFunctionsList',
    'edgeFunctionsSolutionId',
    'edgeFunctionsTime',
    'functionLanguage',
    'ts',
    'virtualhostid'
  ]),

  // ── Azion Runtime ──
  functionConsoleEvents: Object.freeze([
    'configurationId',
    'functionId',
    'id',
    'level',
    'line',
    'lineSource',
    'solutionId',
    'ts'
  ]),

  // ── Image Processor ──
  imagesProcessedEvents: Object.freeze([
    'bytesSent',
    'configurationId',
    'host',
    'httpReferer',
    'httpUserAgent',
    'referenceError',
    'remoteAddr',
    'remotePort',
    'requestMethod',
    'requestTime',
    'requestUri',
    'scheme',
    'sentHttpContentType',
    'serverProtocol',
    'solution',
    'sslCipher',
    'sslProtocol',
    'sslSessionReused',
    'status',
    'tcpinfoRtt',
    'ts',
    'upstreamCacheStatus',
    'upstreamResponseTime',
    'upstreamResponseTimeStr',
    'upstreamStatus',
    'upstreamStatusStr'
  ]),

  // ── Tiered Cache (renamed from l2CacheEvents) ──
  tieredCacheEvents: Object.freeze([
    'bytesSent',
    'cacheKey',
    'cacheTtl',
    'configurationId',
    'host',
    'proxyHost',
    'proxyStatus',
    'proxyUpstream',
    'referenceError',
    'remoteAddr',
    'remotePort',
    'requestLength',
    'requestMethod',
    'requestTime',
    'requestUri',
    'scheme',
    'sentHttpContentType',
    'serverProtocol',
    'solution',
    'status',
    'tcpinfoRtt',
    'ts',
    'upstreamBytesReceived',
    'upstreamBytesReceivedStr',
    'upstreamCacheStatus',
    'upstreamConnectTime',
    'upstreamHeaderTime',
    'upstreamResponseTime',
    'upstreamStatus'
  ]),

  // ── Edge DNS (renamed from idnsQueriesEvents) ──
  edgeDnsQueriesEvents: Object.freeze([
    'level',
    'qtype',
    'resolutionType',
    'statusCode',
    'solutionId',
    'ts',
    'uuid',
    'zoneId'
  ]),

  // ── Data Stream ──
  dataStreamedEvents: Object.freeze([
    'configurationId',
    'dataStreamed',
    'endpointType',
    'jobName',
    'statusCode',
    'streamedLines',
    'ts',
    'url'
  ]),

  // ── Activity History ──
  activityHistoryEvents: Object.freeze([
    'accountId',
    'authorEmail',
    'authorName',
    'comment',
    'parentResourceId',
    'parentResourceType',
    'parentResourceName',
    'refererHeader',
    'remotePort',
    'resourceId',
    'resourceType',
    'resourceName',
    'requestData',
    'title',
    'ts',
    'type',
    'userAgent',
    'userId',
    'userIp',
    'uuid'
  ])
})

/**
 * Returns the curated field list for a dataset, or `null` when the dataset
 * isn't registered. Consumers that layer introspection on top should prefer
 * `getDatasetFields` from `@/modules/filter-loaders/dataset-fields-loader`.
 *
 * @param {string} dataset
 * @returns {readonly string[] | null}
 */
export const getCuratedFields = (dataset) => CURATED_DATASET_FIELDS[dataset] || null
