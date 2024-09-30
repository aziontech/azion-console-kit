import REPORTS_TEXTS from './reports-texts'
import HELP_CENTER_URLS from './help-center-urls'

/**
 * @typedef {Object} Report
 * @property {string} id - The unique identifier of the report.
 * @property {string} chartOwner - The owner of the chart.
 * @property {string} label - The label of the report.
 * @property {string} description - The description of the report.
 * @property {string} aggregationType - The type of aggregation used in the report.
 * @property {number} columns - The number of columns in the report.
 * @property {string} type - The type of the report.
 * @property {string} xAxis - The x-axis of the report.
 * @property {boolean} isTopX - Flag to determine if the report is a top X report.
 * @property {boolean} rotated - Flag to determine if the report is rotated.
 * @property {string} dataUnit - The unit of data in the report.
 * @property {string} dataset - The dataset used in the report.
 * @property {number} limit - The limit of data points in the report.
 * @property {Array<string>} fields - The fields used in the report.
 * @property {Array<string>} groupBy - The fields to group by in the report.
 * @property {string} orderDirection - The direction of ordering in the report.
 * @property {string} dashboardId - The id of the dashboard the report belongs to.
 * @property {string} helpCenterPath - The path to the help center for the report.
 * @property {string} [variationType] - The type of variation in the report.
 * @property {number} [maxYAxis] - The maximum value for the y-axis in the report.
 */
const REPORTS = [
  /**
   * BUILD
   * Edge Applications - Data Transferred
   */
  {
    id: '356217848089018959',
    chartOwner: 'azion',
    label: 'Edge Cache',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.edgeCache.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bytes',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['dataTransferredTotal', 'dataTransferredOut', 'dataTransferredIn'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.edgeCache
  },
  {
    id: '356220228059791957',
    chartOwner: 'azion',
    label: 'Edge Offload',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.edgeOffload.description,
    aggregationType: 'avg',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'percentage',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['offload'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'regular',
    maxYAxis: 100,
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.edgeOffload
  },
  {
    id: '356220625185931855',
    chartOwner: 'azion',
    label: 'Saved Data',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.savedData.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'bytes',
    limit: 5000,
    fields: ['savedData'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.savedData
  },
  {
    id: '356220671983878733',
    chartOwner: 'azion',
    label: 'Missed Data',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.missedData.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bytes',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['missedData'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.missedData
  },
  {
    id: '357550842741523030',
    chartOwner: 'azion',
    label: 'Total Bandwidth Usage',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.totalBandwidthUsage.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bitsPerSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['bandwidthTotal'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.totalBandwidthUsage
  },
  {
    id: '357550842741523029',
    chartOwner: 'azion',
    label: 'Bandwidth Offloaded',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.bandwidthOffloaded.description,
    aggregationType: 'avg',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'percentage',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['bandwidthOffload'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'regular',
    maxYAxis: 100,
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.bandwidthOffloaded
  },
  {
    id: '357817189325079119',
    chartOwner: 'azion',
    label: 'Saved Bandwidth',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.savedBandwidth.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bitsPerSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['bandwidthSavedData'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.savedBandwidth
  },
  {
    id: '357817270971400783',
    chartOwner: 'azion',
    label: 'Missed Bandwidth',
    description: REPORTS_TEXTS.edgeApplications.dataTransferred.missedBandwidth.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bitsPerSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['bandwidthMissedData'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548608166298191',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.dataTransferred.missedBandwidth
  },
  /**
   * BUILD
   * Edge Applications - Requests
   */
  {
    id: '357822254142194261',
    chartOwner: 'azion',
    label: 'Total Requests',
    description: REPORTS_TEXTS.edgeApplications.requests.totalRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['edgeRequestsTotal', 'httpsRequestsTotal', 'httpRequestsTotal'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.totalRequests
  },
  {
    id: '357822606596899407',
    chartOwner: 'azion',
    label: 'Requests Offloaded',
    description: REPORTS_TEXTS.edgeApplications.requests.requestsOffloaded.description,
    aggregationType: 'avg',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'percentage',
    limit: 5000,
    fields: ['requestsOffloaded'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'regular',
    maxYAxis: 100,
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.requestsOffloaded
  },
  {
    id: '357823841952596559',
    chartOwner: 'azion',
    label: 'Saved Requests',
    description: REPORTS_TEXTS.edgeApplications.requests.savedRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['savedRequests'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.savedRequests
  },
  {
    id: '357823947031446101',
    chartOwner: 'azion',
    label: 'Missed Requests',
    description: REPORTS_TEXTS.edgeApplications.requests.missedRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['missedRequests'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.missedRequests
  },
  {
    id: '357824034956640847',
    chartOwner: 'azion',
    label: 'Total Requests per Second',
    description: REPORTS_TEXTS.edgeApplications.requests.totalRequestsPerSecond.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'perSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['edgeRequestsTotalPerSecond'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.totalRequestsPerSecond
  },
  {
    id: '357824230790791757',
    chartOwner: 'azion',
    label: 'Requests per Second Offloaded',
    description: REPORTS_TEXTS.edgeApplications.requests.requestsPerSecondOffloaded.description,
    aggregationType: 'avg',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'percentage',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['requestsPerSecondOffloaded'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'regular',
    maxYAxis: 100,
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.requestsPerSecondOffloaded
  },
  {
    id: '357824321753711189',
    chartOwner: 'azion',
    label: 'Saved Requests per Second',
    description: REPORTS_TEXTS.edgeApplications.requests.savedRequestsPerSecond.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'perSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['savedRequestsPerSecond'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.savedRequestsPerSecond
  },
  {
    id: '357824572487107151',
    chartOwner: 'azion',
    label: 'Missed Requests per Second',
    description: REPORTS_TEXTS.edgeApplications.requests.missedRequestsPerSecond.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'perSecond',
    dataset: 'httpMetrics',
    limit: 5000,
    fields: ['missedRequestsPerSecond'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.missedRequestsPerSecond
  },
  {
    id: '357825388709151309',
    chartOwner: 'azion',
    label: 'Requests by Method',
    description: REPORTS_TEXTS.edgeApplications.httpMethods.requestsByMethod.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: [
      'requestsHttpMethodGet',
      'requestsHttpMethodPost',
      'requestsHttpMethodHead',
      'requestsHttpMethodOthers'
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548623571976783',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.requests.requestsByMethod
  },
  /**
   * BUILD
   * Edge Applications - Status Codes
   */
  {
    id: '357824919768138325',
    chartOwner: 'azion',
    label: 'HTTP Status Codes 2XX',
    description: REPORTS_TEXTS.edgeApplications.statusCodes.httpStatusCodes2xx.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: [
      'requestsStatusCode200',
      'requestsStatusCode204',
      'requestsStatusCode206',
      'requestsStatusCode2xx'
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548642810200653',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.statusCodes.httpStatusCodes2xx
  },
  {
    id: '357825000731837013',
    chartOwner: 'azion',
    label: 'HTTP Status Codes 3XX',
    description: REPORTS_TEXTS.edgeApplications.statusCodes.httpStatusCodes3xx.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: [
      'requestsStatusCode301',
      'requestsStatusCode302',
      'requestsStatusCode304',
      'requestsStatusCode3xx'
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548642810200653',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.statusCodes.httpStatusCodes3xx
  },
  {
    id: '357825058049098319',
    chartOwner: 'azion',
    label: 'HTTP Status Codes 4XX',
    description: REPORTS_TEXTS.edgeApplications.statusCodes.httpStatusCodes4xx.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: [
      'requestsStatusCode400',
      'requestsStatusCode403',
      'requestsStatusCode404',
      'requestsStatusCode4xx'
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548642810200653',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.statusCodes.httpStatusCodes4xx
  },
  {
    id: '357825090550760015',
    chartOwner: 'azion',
    label: 'HTTP Status Codes 5XX',
    description: REPORTS_TEXTS.edgeApplications.statusCodes.httpStatusCodes5xx.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: [
      'requestsStatusCode500',
      'requestsStatusCode502',
      'requestsStatusCode503',
      'requestsStatusCode5xx'
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548642810200653',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.statusCodes.httpStatusCodes5xx
  },
  /**
   * BUILD
   * Edge Applications - Bandwidth Saving
   */
  {
    id: '357843490139275861',
    chartOwner: 'azion',
    label: 'Bandwidth Saving',
    description: REPORTS_TEXTS.edgeApplications.bandwidthSaving.bandwidthSaving.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'bytes',
    limit: 5000,
    fields: ['bandwidthImagesProcessedSavedData'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357549179454620239',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeApplications.bandwidthSaving.bandwidthSaving
  },
  /**
   * BUILD
   * Tiered Cache - Caching Offload
   */
  {
    id: '357826217661956693',
    chartOwner: 'azion',
    label: 'Tiered Cache',
    description: REPORTS_TEXTS.tieredCache.cachingOffload.tieredCache.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bytes',
    dataset: 'l2CacheMetrics',
    groupBy: [],
    limit: 5000,
    fields: ['dataTransferredTotal', 'dataTransferredOut', 'dataTransferredIn'],
    orderDirection: 'ASC',
    dashboardId: '357549371218199219',
    helpCenterPath: HELP_CENTER_URLS.tieredCache.cachingOffload.tieredCache
  },
  {
    id: '357826288204907093',
    chartOwner: 'azion',
    label: 'Tiered Cache Offload',
    description: REPORTS_TEXTS.tieredCache.cachingOffload.tieredCacheOffload.description,
    aggregationType: 'avg',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'percentage',
    groupBy: [],
    dataset: 'l2CacheMetrics',
    limit: 5000,
    fields: ['offload'],
    orderDirection: 'ASC',
    dashboardId: '357549371218199219',
    variationType: 'regular',
    maxYAxis: 100,
    helpCenterPath: HELP_CENTER_URLS.tieredCache.cachingOffload.tieredCacheOffload
  },
  /**
   * BUILD
   * Edge Functions - Invocations
   */
  {
    id: '357843490139298763',
    chartOwner: 'azion',
    label: 'Total Invocations',
    description: REPORTS_TEXTS.edgeFunctions.invocations.totalInvocations.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'edgeFunctionsMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['edgeApplicationInvocations', 'edgeFirewallInvocations'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357549319029523021',
    helpCenterPath: HELP_CENTER_URLS.edgeFunctions.invocations.totalInvocations
  },
  /**
   * BUILD
   * Image Processor - Requests
   */
  {
    id: '357844490139298789',
    chartOwner: 'azion',
    label: 'Total Requests',
    description: REPORTS_TEXTS.imageProcessor.requests.totalRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'imagesProcessedMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      or: {
        status: 304,
        statusRange: {
          begin: 199,
          end: 299
        }
      }
    },
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357549422933967445',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.imageProcessor.requests.totalRequests
  },
  {
    id: '357843490195298789',
    chartOwner: 'azion',
    label: 'Total Requests per Second',
    description: REPORTS_TEXTS.imageProcessor.requests.totalRequestsPerSecond.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'imagesProcessedMetrics',
    dataUnit: 'perSecond',
    limit: 5000,
    filters: {
      or: {
        status: 304,
        statusRange: {
          begin: 200,
          end: 299
        }
      }
    },
    aggregations: [
      {
        aggregation: 'rate',
        variable: 'requests'
      }
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357549422933967445',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.imageProcessor.requests.totalRequestsPerSecond
  },
  /**
   * SECURE
   * Overview - Request
   */
  {
    id: '357822591213814093',
    chartOwner: 'azion',
    label: 'Total Attacks',
    description: '',
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    limit: 5000,
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837199999',
    variationType: 'inverse',
    helpCenterPath: ''
  },
  /**
   * SECURE
   * WAF - threats
   */
  {
    id: '357842594513814093',
    chartOwner: 'azion',
    label: 'Threats vs Requests',
    description: REPORTS_TEXTS.edgeApplications.waf.threatsVsRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['wafRequestsAllowed', 'wafRequestsBlocked', 'wafRequestsThreat'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837198933',
    helpCenterPath: HELP_CENTER_URLS.waf.threats.threatsVsRequests
  },
  {
    id: '357842775438262861',
    chartOwner: 'azion',
    label: 'Cross-Site scripting (XSS) Threats',
    description: REPORTS_TEXTS.edgeApplications.waf.crossSiteScriptingXssThreats.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['wafRequestsXssAttacks'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837198933',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.waf.threats.crossSiteScriptingXssThreats
  },
  {
    id: '357842594513814012',
    chartOwner: 'azion',
    label: 'Remote File Inclusion (RFI) Threats',
    description: REPORTS_TEXTS.edgeApplications.waf.remoteFileInclusionRfiThreats.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['wafRequestsRfiAttacks'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837198933',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.waf.threats.remoteFileInclusionRfiThreats
  },
  {
    id: '357842833307075157',
    chartOwner: 'azion',
    label: 'SQL Injection Threats',
    description: REPORTS_TEXTS.edgeApplications.waf.sqlInjectionThreats.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['wafRequestsSqlAttacks'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837198933',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.waf.threats.sqlInjectionThreats
  },
  {
    id: '357842851576414805',
    chartOwner: 'azion',
    label: 'Other Threats',
    description: REPORTS_TEXTS.edgeApplications.waf.otherThreats.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'httpMetrics',
    dataUnit: 'count',
    limit: 5000,
    fields: ['wafRequestsOthersAttacks'],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357548675837198933',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.waf.threats.otherThreats
  },
  /**
   * SECURE
   * Edge DNS - Standard Queries
   */
  {
    id: '357843490139298789',
    chartOwner: 'azion',
    label: 'Total Queries',
    description: REPORTS_TEXTS.edgeDns.standardQueries.totalQueries.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'idnsQueriesMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '357549371218199119',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.edgeDns.standardQueries.totalQueries
  },
  /**
   * SECURE
   * Bot Manager - Bot Manager Overview
   */
  {
    id: '892249168369791027',
    chartOwner: 'azion',
    label: 'Bad Bot Hits',
    description: REPORTS_TEXTS.botManager.botManagerOverview.badBotHits.description,
    aggregationType: 'sum',
    columns: 3,
    type: 'big-numbers',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'botManagerMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      classifiedEq: 'bad bot'
    },
    groupBy: [],
    fields: [],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.badBotHits
  },
  {
    id: '934654293238823255',
    chartOwner: 'azion',
    label: 'Good Bot Hits',
    description: REPORTS_TEXTS.botManager.botManagerOverview.goodBotHits.description,
    aggregationType: 'sum',
    columns: 3,
    type: 'big-numbers',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'botManagerMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      classifiedEq: 'good bot'
    },
    groupBy: [],
    fields: [],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'neutral',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.goodBotHits
  },
  {
    id: '259047966206560862',
    chartOwner: 'azion',
    label: 'Bot Hits',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botHits.description,
    aggregationType: 'sum',
    columns: 3,
    type: 'big-numbers',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'botManagerMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      classifiedIn: ['bad bot', 'good bot']
    },
    groupBy: [],
    fields: [],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.botHits
  },
  {
    id: '541669034905662013',
    chartOwner: 'azion',
    label: 'Transactions',
    description: REPORTS_TEXTS.botManager.botManagerOverview.transactions.description,
    aggregationType: 'sum',
    columns: 3,
    type: 'big-numbers',
    xAxis: 'ts',
    isTopX: false,
    rotated: true,
    dataset: 'botManagerMetrics',
    dataUnit: 'count',
    limit: 5000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    groupBy: [],
    fields: [],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'neutral',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.transactions
  },
  {
    id: '329891149133127508',
    chartOwner: 'azion',
    label: 'Bot Traffic',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botTraffic.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    limit: 10000,
    groupBy: ['classified'],
    orderDirection: 'ASC',
    dashboardId: '371360344901061482',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.botTraffic
  },
  {
    id: '577704475532819772',
    chartOwner: 'azion',
    label: 'Top Bot Action',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botAction.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'pie',
    xAxis: 'cat',
    isTopX: true,
    rotated: false,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      not: {
        botCategoryIn: ['', 'Non-Bot Like']
      }
    },
    limit: 10,
    groupBy: ['action'],
    fields: ['action'],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.topBotAction
  },
  {
    id: '071851224118431167',
    chartOwner: 'azion',
    label: 'Bot CAPTCHA',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botCaptcha.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {},
    limit: 5000,
    groupBy: ['challengeSolved'],
    orderDirection: 'ASC',
    dashboardId: '371360344901061482',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.botCaptchaLine
  },
  {
    id: '455330743572401794',
    chartOwner: 'azion',
    label: 'Top Bot CAPTCHA',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botCaptcha.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'pie',
    xAxis: 'cat',
    isTopX: true,
    rotated: false,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {},
    limit: 2,
    groupBy: ['challengeSolved'],
    fields: ['challengeSolved'],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.topBotCaptchaPie
  },
  {
    id: '424388331488145485',
    chartOwner: 'azion',
    label: 'Top Bot Classifications',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botClassification.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'ordered-bar',
    xAxis: 'cat',
    isTopX: true,
    rotated: true,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      not: {
        botCategoryIn: ['', 'Non-Bot Like']
      }
    },
    limit: 10,
    groupBy: ['botCategory'],
    fields: ['botCategory'],
    orderDirection: 'DESC',
    dashboardId: '371360344901061482',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.topBotClassification
  },
  {
    id: '190246009413028885',
    chartOwner: 'azion',
    label: 'Bot Activity Map',
    description: REPORTS_TEXTS.botManager.botManagerOverview.botActivityMap.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'map',
    xAxis: 'cat',
    isTopX: true,
    rotated: false,
    dataUnit: 'count',
    dataset: 'botManagerMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'requests'
      }
    ],
    filters: {
      classifiedIn: ['bad bot', 'good bot']
    },
    limit: 5000,
    groupBy: ['geolocCountryName'],
    fields: ['geolocCountryName'],
    orderDirection: 'ASC',
    dashboardId: '371360344901061482',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerOverview.botActivityMap
  },
  /**
   * SECURE
   * Bot Manager - Bot Manager Breakdown
   */
  {
    id: '847143804009563421',
    chartOwner: 'azion',
    label: 'Impacted URLs',
    description: REPORTS_TEXTS.botManager.botManagerBreakdown.impactedUrls.description,
    aggregationType: 'sum',
    columns: 3,
    type: 'big-numbers',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataset: 'securityMetrics',
    dataUnit: 'count',
    limit: 10000,
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'value'
      }
    ],
    filters: {
      metricEq: 'uniq_request_url',
      datasetEq: 'bot_manager'
    },
    groupBy: [],
    fields: [],
    orderDirection: 'DESC',
    dashboardId: '659868342290523846',
    variationType: 'inverse',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerBreakdown.impactedUrls
  },
  {
    id: '978435123222265554',
    chartOwner: 'azion',
    label: 'Top Bad Bot IPs',
    description: REPORTS_TEXTS.botManager.botManagerBreakdown.topBadBotIps.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'ordered-bar',
    xAxis: 'cat',
    isTopX: true,
    rotated: true,
    dataUnit: 'count',
    dataset: 'securityMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'value'
      }
    ],
    filters: {
      datasetEq: 'bot_manager',
      metricEq: 'top_bad_remote_addr'
    },
    limit: 10,
    groupBy: ['dimension1'],
    fields: ['dimension1'],
    orderDirection: 'DESC',
    dashboardId: '659868342290523846',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerBreakdown.topBadBotIps
  },
  {
    id: '1030427483148242',
    chartOwner: 'azion',
    label: 'Top Impacted URLs',
    description: REPORTS_TEXTS.botManager.botManagerBreakdown.topImpactedUrls.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'ordered-bar',
    xAxis: 'cat',
    isTopX: true,
    rotated: true,
    dataUnit: 'count',
    dataset: 'securityMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'value'
      }
    ],
    filters: {
      datasetEq: 'bot_manager',
      metricEq: 'top_request_url'
    },
    limit: 10,
    groupBy: ['dimension1'],
    fields: ['dimension1'],
    orderDirection: 'DESC',
    dashboardId: '659868342290523846',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.botManager.botManagerBreakdown.topImpactedUrls
  },
  /**
   * OBSERVE
   * Data Stream - Data Streamed
   */
  {
    id: '352149351588430415',
    chartOwner: 'azion',
    label: 'Total Data Streamed',
    description: REPORTS_TEXTS.dataStream.dataStreamed.totalData.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'bytes',
    dataset: 'dataStreamedMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'dataStreamed'
      }
    ],
    limit: 5000,
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '352149476039721549',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.dataStream.requests.totalDataStreamed
  },
  {
    id: '352234687543902797',
    chartOwner: 'azion',
    label: 'Total Requests',
    description: REPORTS_TEXTS.dataStream.dataStreamRequests.totalRequests.description,
    aggregationType: 'sum',
    columns: 6,
    type: 'line',
    xAxis: 'ts',
    isTopX: false,
    rotated: false,
    dataUnit: 'count',
    dataset: 'dataStreamedMetrics',
    aggregations: [
      {
        aggregation: 'sum',
        variable: 'streamedLines'
      }
    ],
    limit: 5000,
    groupBy: [],
    orderDirection: 'ASC',
    dashboardId: '352149476039721549',
    variationType: 'regular',
    helpCenterPath: HELP_CENTER_URLS.dataStream.requests.totalRequests
  }
]

export default REPORTS
