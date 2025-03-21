import { describe, expect, it } from 'vitest'
import { REPORTS } from '@modules/real-time-metrics/constants'

describe('RealTimeMetricsModule', () => {
  describe('Report constants', () => {
    it('should be defined', () => {
      expect(REPORTS).toBeDefined()
    })

    it('should have the correct of values', () => {
      const reports = [
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bytes',
          dataset: 'httpMetrics',
          description:
            'Sum of data transferred through Edge Cache. Displays the data in bytes divided by Data Transferred, Data Transferred In, and Data Transferred Out.',
          fields: ['dataTransferredTotal', 'dataTransferredOut', 'dataTransferredIn'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/edge-cache',
          id: '356217848089018959',
          isTopX: false,
          label: 'Edge Cache',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'percentage',
          dataset: 'httpMetrics',
          description:
            'Percentage of data successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.',
          fields: ['offload'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/edge-offload',
          id: '356220228059791957',
          isTopX: false,
          label: 'Edge Offload',
          limit: 5000,
          maxYAxis: 100,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bytes',
          dataset: 'httpMetrics',
          description:
            'Sum of data delivered by the edge without searching for the content on the origin server. Displays the data in bytes.',
          fields: ['savedData'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/saved-data',
          id: '356220625185931855',
          isTopX: false,
          label: 'Saved Data',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bytes',
          dataset: 'httpMetrics',
          description:
            'Amount of data delivered by the edge after searching for the content on the origin server. Displays the data in bytes.',
          fields: ['missedData'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/missed-data',
          id: '356220671983878733',
          isTopX: false,
          label: 'Missed Data',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bitsPerSecond',
          dataset: 'httpMetrics',
          description:
            'Average of bandwidth used while the edge delivers your content. Displays the total amount of bandwidth used.',
          fields: ['bandwidthTotal'],
          groupBy: [],
          helpCenterPath:
            '/real-time-metrics/edge-applications/data-transferred/total-bandwidth-usage',
          id: '357550842741523030',
          isTopX: false,
          label: 'Total Bandwidth Usage',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'percentage',
          dataset: 'httpMetrics',
          description:
            'Percentage of bandwidth successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.',
          fields: ['bandwidthOffload'],
          groupBy: [],
          helpCenterPath:
            '/real-time-metrics/edge-applications/data-transferred/bandwidth-offloaded',
          id: '357550842741523029',
          isTopX: false,
          label: 'Bandwidth Offloaded',
          limit: 5000,
          maxYAxis: 100,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bitsPerSecond',
          dataset: 'httpMetrics',
          description:
            'Average of bandwidth delivered by the edge without searching for the content on the origin server. Displays the average of bandwidth saved.',
          fields: ['bandwidthSavedData'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/saved-bandwidth',
          id: '357817189325079119',
          isTopX: false,
          label: 'Saved Bandwidth',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548608166298191',
          dataUnit: 'bitsPerSecond',
          dataset: 'httpMetrics',
          description:
            'Average of bandwidth used by the origin server to search for content. Displays the average of bandwidth used.',
          fields: ['bandwidthMissedData'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/data-transferred/missed-bandwidth',
          id: '357817270971400783',
          isTopX: false,
          label: 'Missed Bandwidth',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Quantity of requests made to your domain. Displays the total amount of requests divided by Edge Requests Total, Https Requests Total, and Http Requests Total.',
          fields: ['edgeRequestsTotal', 'httpsRequestsTotal', 'httpRequestsTotal'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/total-requests',
          id: '357822254142194261',
          isTopX: false,
          label: 'Total Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'percentage',
          dataset: 'httpMetrics',
          description:
            'Percentage of requests delivered directly by the edge, without searching for the content on the origin server. Displays the data in percentages.',
          fields: ['requestsOffloaded'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/requests-offloaded',
          id: '357822606596899407',
          isTopX: false,
          label: 'Requests Offloaded',
          limit: 5000,
          maxYAxis: 100,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Quantity of requests delivered by the edge without searching for the content on the origin server. Displays the total amount of requests saved.',
          fields: ['savedRequests'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/saved-requests',
          id: '357823841952596559',
          isTopX: false,
          label: 'Saved Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Amount of requests delivered by the edge after searching for the content on the origin server. Displays the sum of missed requests.',
          fields: ['missedRequests'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/missed-requests',
          id: '357823947031446101',
          isTopX: false,
          label: 'Missed Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'perSecond',
          dataset: 'httpMetrics',
          description:
            'Average of requests per second made from customers to your domain. Displays the average number of requests per second.',
          fields: ['edgeRequestsTotalPerSecond'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/total-requests-per-second',
          id: '357824034956640847',
          isTopX: false,
          label: 'Total Requests per Second',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'percentage',
          dataset: 'httpMetrics',
          description:
            'Percentage of requests per second delivered directly by the edge without searching for the content on the origin server. Displays the average number of offloaded requests per second in percentages.',
          fields: ['requestsPerSecondOffloaded'],
          groupBy: [],
          helpCenterPath:
            '/real-time-metrics/edge-applications/requests/requests-per-second-offloaded',
          id: '357824230790791757',
          isTopX: false,
          label: 'Requests per Second Offloaded',
          limit: 5000,
          maxYAxis: 100,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'perSecond',
          dataset: 'httpMetrics',
          description:
            'Average of requests per second delivered by the edge without searching for the content on the origin server. Displays the average number of saved requests delivered.',
          fields: ['savedRequestsPerSecond'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/saved-requests-per-second',
          id: '357824321753711189',
          isTopX: false,
          label: 'Saved Requests per Second',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'perSecond',
          dataset: 'httpMetrics',
          description:
            'Average of requests per second delivered by the edge after searching for the content on the origin server. Displays the average number of missed requests per second.',
          fields: ['missedRequestsPerSecond'],
          groupBy: [],
          helpCenterPath:
            '/real-time-metrics/edge-applications/requests/missed-requests-per-second',
          id: '357824572487107151',
          isTopX: false,
          label: 'Missed Requests per Second',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of requests for each HTTP method during the selected period. Displays the overall request count for each method.',
          fields: [],
          groupBy: ['ts', 'requestMethod'],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/requests-by-method',
          id: '357825388709151309',
          isTopX: false,
          label: 'Requests by Method',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'perSecond',
          dataset: 'httpMetrics',
          description:
            'Average request duration over time. Displays how long requests take on average, in seconds.',
          fields: [],
          groupBy: [],
          aggregations: [
            {
              aggregation: 'avg',
              variable: 'requestTime'
            }
          ],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/average-request-time',
          id: '357825388709151310',
          variationType: 'inverse',
          isTopX: false,
          label: 'Average Request Time',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548623571976783',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description: 'Sum of requests, categorized by scheme, over the selected period.',
          fields: [],
          groupBy: ['ts', 'scheme'],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/requests-by-scheme',
          id: '357825388709151312',
          variationType: 'inverse',
          isTopX: false,
          label: 'Requests by Scheme',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548642810200653',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Indicates successful responses to user requests. Displays Request Status Code 200 and other 2xx status codes.',
          fields: [],
          groupBy: ['ts', 'status'],
          helpCenterPath: '/real-time-metrics/edge-applications/status-codes/http-status-codes-2xx',
          id: '357824919768138325',
          isTopX: false,
          label: 'HTTP Status Codes 2XX',
          limit: 10000,
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            statusRange: {
              begin: 200,
              end: 299
            }
          },
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548642810200653',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Indicates redirections that have occurred with user requests. Displays Request Status Code 300 and other 3xx status codes.',
          fields: [],
          groupBy: ['ts', 'status'],
          helpCenterPath: '/real-time-metrics/edge-applications/status-codes/http-status-codes-3xx',
          id: '357825000731837013',
          isTopX: false,
          label: 'HTTP Status Codes 3XX',
          limit: 10000,
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            statusRange: {
              begin: 300,
              end: 399
            }
          },
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548642810200653',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            "Indicates errors that have occurred with user's requests. Displays Requests Status Code 400, Requests Status Code 403, Requests Status Code 404, and Requests Status Code 4xx.",
          fields: [
            'requestsStatusCode400',
            'requestsStatusCode403',
            'requestsStatusCode404',
            'requestsStatusCode4xx'
          ],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/status-codes/http-status-codes-4xx',
          id: '357825058049098319',
          isTopX: false,
          label: 'HTTP Status Codes 4XX',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548642810200653',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Indicates the server failed to deliver an apparently valid request. Displays Requests Status Code 500, Requests Status Code 502, Requests Status Code 503, and Requests Status Code 5xx.',
          fields: [
            'requestsStatusCode500',
            'requestsStatusCode502',
            'requestsStatusCode503',
            'requestsStatusCode5xx'
          ],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/status-codes/http-status-codes-5xx',
          id: '357825090550760015',
          isTopX: false,
          label: 'HTTP Status Codes 5XX',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548642810200653',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of processed requests, broken down by the top status and upstream status categories responsible for the most flagged requests.',
          fields: ['status', 'upstreamStatus'],
          groupBy: ['status', 'upstreamStatus'],
          helpCenterPath: '/real-time-metrics/edge-applications/requests/average-request-time',
          id: '357825388709151322',
          isTopX: false,
          label: 'Requests by Status and Upstream Status ',
          limit: 10,
          orderDirection: 'DESC',
          rotated: false,
          type: 'list',
          variationType: 'inverse',
          xAxis: 'cat'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549179454620239',
          dataUnit: 'bytes',
          dataset: 'httpMetrics',
          description:
            "Images that were processed and delivered by Image Processor. Displays domains' savings when transmitting images in bytes.",
          fields: ['bandwidthImagesProcessedSavedData'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-applications/bandwidth-saving/bandwidth-saving',
          id: '357843490139275861',
          isTopX: false,
          label: 'Bandwidth Saving',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 12,
          dashboardId: '357549179454620240',
          dataUnit: 'count',
          dataset: 'httpBreakdownMetrics',
          description:
            'Displays the distribution of requests by region, country, ASN, and individual IP address.',
          fields: ['remoteAddress', 'geolocAsn', 'geolocCountryName', 'geolocRegionName'],
          groupBy: ['remoteAddress', 'geolocAsn', 'geolocCountryName', 'geolocRegionName'],
          helpCenterPath:
            '/real-time-metrics/edge-applications/request-breakdown/ip-address-information',
          id: '357825388709151326',
          isTopX: false,
          label: 'IP Address Information',
          limit: 10,
          orderDirection: 'DESC',
          rotated: false,
          type: 'list',
          variationType: 'inverse',
          xAxis: 'cat'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549371218199219',
          dataUnit: 'bytes',
          dataset: 'l2CacheMetrics',
          description:
            'Sum of data transferred through Tiered Cache. Displays the data in bytes divided by Data Transferred Total, Data Transferred In, and Data Transferred Out.',
          fields: ['dataTransferredTotal', 'dataTransferredOut', 'dataTransferredIn'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/tiered-cache/caching-offload/tiered-cache',
          id: '357826217661956693',
          isTopX: false,
          label: 'Tiered Cache',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'avg',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549371218199219',
          dataUnit: 'percentage',
          dataset: 'l2CacheMetrics',
          description:
            'Percentage of data successfully delivered by Tiered Cache to the edge without searching for the content on the origin server. Displays the average number of data in percentages.',
          fields: ['offload'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/tiered-cache/caching-offload/tiered-cache-offload',
          id: '357826288204907093',
          isTopX: false,
          label: 'Tiered Cache Offload',
          limit: 5000,
          maxYAxis: 100,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549319029523021',
          dataUnit: 'count',
          dataset: 'edgeFunctionsMetrics',
          description:
            'Quantity of times an edge function has been executed. Displays the total amount of invocations divided by Edge Firewall Invocations and Edge Application Invocations.',
          fields: ['edgeApplicationInvocations', 'edgeFirewallInvocations'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-functions/invocations/total-invocations',
          id: '357843490139298763',
          isTopX: false,
          label: 'Total Invocations',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549422933967445',
          dataUnit: 'count',
          dataset: 'imagesProcessedMetrics',
          description:
            'Quantity of requests made to your content images being processed. Displays the total amount of requests.',
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
          helpCenterPath: '/real-time-metrics/image-processor/requests/total-requests',
          id: '357844490139298789',
          isTopX: false,
          label: 'Total Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'rate',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549422933967445',
          dataUnit: 'perSecond',
          dataset: 'imagesProcessedMetrics',
          description:
            'Requests per second made to your content images being processed. Displays the average number of requests per second.',
          filters: {
            or: {
              status: 304,
              statusRange: {
                begin: 200,
                end: 299
              }
            }
          },
          groupBy: [],
          helpCenterPath: '/real-time-metrics/image-processor/requests/total-requests-per-second',
          id: '357843490195298789',
          isTopX: false,
          label: 'Total Requests per Second',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837199999',
          dataset: 'httpMetrics',
          description: '',
          groupBy: [],
          helpCenterPath: '',
          id: '357822591213814093',
          isTopX: false,
          label: 'Total Attacks',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of attacks processed by WAF. Displays the total amount of Waf Requests Blocked, Waf Requests Threats, and Waf Requests Allowed.',
          fields: ['wafRequestsAllowed', 'wafRequestsBlocked', 'wafRequestsThreat'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/waf/threats/threats-vs-requests',
          id: '357842594513814093',
          isTopX: false,
          label: 'Threats vs Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of Cross-Site Scripting attacks against your domains. Displays the total amount of threats.',
          fields: ['wafRequestsXssAttacks'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/waf/threats/cross-site-scripting-xss-threats',
          id: '357842775438262861',
          isTopX: false,
          label: 'Cross-Site scripting (XSS) Threats',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of Remote File Inclusion attacks against your domains. Displays the total amount of threats.',
          fields: ['wafRequestsRfiAttacks'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/waf/threats/remote-file-inclusion-rfi-threats',
          id: '357842594513814012',
          isTopX: false,
          label: 'Remote File Inclusion (RFI) Threats',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of SQL Injection attacks against your domains. Displays the total amount of threats.',
          fields: ['wafRequestsSqlAttacks'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/waf/threats/sql-injection-threats',
          id: '357842833307075157',
          isTopX: false,
          label: 'SQL Injection Threats',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of other types of attacks blocked by WAF. Displays the total amount of threats.',
          fields: ['wafRequestsOthersAttacks'],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/waf/threats/other-threats',
          id: '357842851576414805',
          isTopX: false,
          label: 'Other Threats',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of requests identified as threats by WAF, broken down by the top countries responsible for the most flagged requests. Displays the data in percentages.',
          fields: [],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            wafBlock: '1',
            wafLearning: '0'
          },
          groupBy: ['geolocCountryName'],
          helpCenterPath:
            '/real-time-metrics/waf/threats/top-waf-threat-requests-by-country-pie-graph',
          id: '357842851576414806',
          isTopX: true,
          label: 'Top WAF Threat Requests by Country',
          limit: 20,
          orderDirection: 'DESC',
          rotated: false,
          type: 'pie',
          variationType: 'regular',
          xAxis: 'cat'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of requests identified as threats by WAF, broken down by the top countries responsible for the most flagged requests. Displays the total amount of detected threats.',
          fields: [],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            wafBlock: '1',
            wafLearning: '0'
          },
          groupBy: ['geolocCountryName'],
          helpCenterPath:
            '/real-time-metrics/waf/threats/top-waf-threat-requests-by-country-bar-graph',
          id: '357842851576414807',
          isTopX: true,
          label: 'Top WAF Threat Requests by Country',
          limit: 20,
          orderDirection: 'DESC',
          rotated: true,
          type: 'ordered-bar',
          variationType: 'regular',
          xAxis: 'cat'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of requests identified as threats by WAF, broken down by the top attack families responsible for the most flagged requests. Displays the total amount of detected threats.',
          fields: [],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            wafBlock: '1',
            wafLearning: '0'
          },
          groupBy: ['wafAttackFamily'],
          helpCenterPath: '/real-time-metrics/waf/threats/waf-threat-requests-by-family-attack',
          id: '357842851576414808',
          isTopX: true,
          label: 'WAF Threat Requests by Family Attack',
          limit: 10,
          orderDirection: 'DESC',
          rotated: true,
          type: 'ordered-bar',
          variationType: 'regular',
          xAxis: 'cat'
        },
        {
          aggregationType: 'sum',
          chartOwner: 'azion',
          columns: 12,
          dashboardId: '357548675837198933',
          dataUnit: 'count',
          dataset: 'httpMetrics',
          description:
            'Sum of requests identified as threats by WAF, broken down by the top hosts responsible for the most flagged requests. Displays the total amount of detected threats.',
          fields: [],
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          filters: {
            wafBlock: '1',
            wafLearning: '0'
          },
          groupBy: ['ts', 'host'],
          helpCenterPath: '/real-time-metrics/waf/threats/waf-threat-requests-by-host',
          id: '357842851576414809',
          isTopX: false,
          label: 'WAF Threat Requests by Host',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'inverse',
          xAxis: 'ts',
          doNotConvertToCamelCase: true,
          largeTooltip: true
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '357549371218199119',
          dataUnit: 'count',
          dataset: 'idnsQueriesMetrics',
          description:
            'Quantity of queries your DNS received. Displays the total amount of queries.',
          groupBy: [],
          helpCenterPath: '/real-time-metrics/edge-dns/standard-queries/total-queries',
          id: '357843490139298789',
          isTopX: false,
          label: 'Total Queries',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 3,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description: 'Number of requests identified as bad bots.',
          fields: [],
          filters: {
            classifiedEq: 'bad bot'
          },
          groupBy: [],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/bad-bot-hits',
          id: '892249168369791027',
          isTopX: false,
          label: 'Bad Bot Hits',
          limit: 5000,
          orderDirection: 'DESC',
          rotated: false,
          type: 'big-numbers',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 3,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description: 'Number of requests identified as good bots.',
          fields: [],
          filters: {
            classifiedEq: 'good bot'
          },
          groupBy: [],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/good-bot-hits',
          id: '934654293238823255',
          isTopX: false,
          label: 'Good Bot Hits',
          limit: 5000,
          orderDirection: 'DESC',
          rotated: false,
          type: 'big-numbers',
          variationType: 'neutral',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 3,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description: 'Number of requests identified as bots.',
          fields: [],
          filters: {
            classifiedIn: ['bad bot', 'good bot']
          },
          groupBy: [],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/bot-hits',
          id: '259047966206560862',
          isTopX: false,
          label: 'Bot Hits',
          limit: 5000,
          orderDirection: 'DESC',
          rotated: false,
          type: 'big-numbers',
          variationType: 'inverse',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 3,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description: 'Number of requests evaluated by Azion Bot Manager.',
          fields: [],
          groupBy: [],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/transactions',
          id: '541669034905662013',
          isTopX: false,
          label: 'Transactions',
          limit: 5000,
          orderDirection: 'DESC',
          rotated: true,
          type: 'big-numbers',
          variationType: 'neutral',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description:
            'Sum of requests grouped by identifying traffic as Legitimate, Bad Bot, Good Bot, and Under Evaluation.',
          groupBy: ['classified'],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/bot-traffic',
          id: '329891149133127508',
          isTopX: false,
          label: 'Bot Traffic',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'requests'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '371360344901061482',
          dataUnit: 'count',
          dataset: 'botManagerMetrics',
          description:
            'Sum of requests grouped by identifying traffic as Legitimate, Bad Bot, Good Bot, and Under Evaluation.',
          groupBy: ['classified'],
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/top-bot-traffic',
          id: '329891149133127509',
          isTopX: true,
          label: 'Top Bot Traffic',
          limit: 10000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'pie',
          variationType: 'regular',
          xAxis: 'cat'
        },
        {
          id: '577704475532819772',
          chartOwner: 'azion',
          label: 'Top Bot Action',
          description:
            'Actions taken by Azion Bot Manager for requests identified as bots, displayed in both absolute values and percentages.',
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
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/top-bot-action'
        },
        {
          id: '071851224118431167',
          chartOwner: 'azion',
          label: 'Bot CAPTCHA',
          description: 'Sum of CAPTCHA challenge results returned for requests classified as bots.',
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
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/bot-captcha-line-graph'
        },
        {
          id: '455330743572401794',
          chartOwner: 'azion',
          label: 'Top Bot CAPTCHA',
          description: 'Sum of CAPTCHA challenge results returned for requests classified as bots.',
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
          helpCenterPath:
            '/real-time-metrics/bot-manager-advanced/overview/top-bot-captcha-pie-graph'
        },
        {
          id: '424388331488145485',
          chartOwner: 'azion',
          label: 'Top Bot Classifications',
          description:
            'Sum of requests classified according to the tactics used and the purpose of the bots.',
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
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/top-bot-classifications'
        },
        {
          id: '190246009413028885',
          chartOwner: 'azion',
          label: 'Bot Activity Map',
          description: 'Sum of requests identified as bots, presented by the country of origin.',
          aggregationType: 'sum',
          columns: 12,
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
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/overview/bot-activity-map'
        },
        {
          id: '847143804009563421',
          chartOwner: 'azion',
          label: 'Impacted URLs',
          description: 'Sum of the detected bot actions, broken down by the affected URLs.',
          aggregationType: 'sum',
          columns: 3,
          type: 'big-numbers',
          xAxis: 'ts',
          isTopX: false,
          rotated: false,
          dataset: 'botManagerBreakdownMetrics',
          dataUnit: 'count',
          limit: 10000,
          aggregations: [],
          filters: {},
          groupBy: [],
          fields: ['uniqRequestUrl'],
          orderDirection: 'DESC',
          dashboardId: '659868342290523846',
          variationType: 'inverse',
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/breakdown/impacted-urls'
        },
        {
          id: '978435123222265554',
          chartOwner: 'azion',
          label: 'Top Bad Bot IPs',
          description:
            'Sum of requests detected as bad bots, broken down by the highest-ranking IP addresses.',
          aggregationType: 'sum',
          columns: 6,
          type: 'ordered-bar',
          xAxis: 'cat',
          isTopX: true,
          rotated: true,
          dataUnit: 'count',
          dataset: 'botManagerBreakdownMetrics',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'badBotRequests'
            }
          ],
          filters: {},
          limit: 10,
          groupBy: ['remoteAddr'],
          fields: ['remoteAddr'],
          orderDirection: 'DESC',
          dashboardId: '659868342290523846',
          variationType: 'regular',
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/breakdown/top-bad-bot-ips'
        },
        {
          id: '1030427483148242',
          chartOwner: 'azion',
          label: 'Top Impacted URLs',
          description: 'Sum of the detected bot actions, broken down by the most affected URLs.',
          aggregationType: 'sum',
          columns: 6,
          type: 'ordered-bar',
          xAxis: 'cat',
          isTopX: true,
          rotated: true,
          dataUnit: 'count',
          dataset: 'botManagerBreakdownMetrics',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'botRequests'
            }
          ],
          filters: {},
          limit: 10,
          groupBy: ['requestUrl'],
          fields: ['requestUrl'],
          orderDirection: 'DESC',
          dashboardId: '659868342290523846',
          variationType: 'regular',
          helpCenterPath: '/real-time-metrics/bot-manager-advanced/breakdown/top-impacted-urls'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'dataStreamed'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '352149476039721549',
          dataUnit: 'bytes',
          dataset: 'dataStreamedMetrics',
          description:
            'Quantity of data streamed to the configured connectors in bytes. Displays the total data sent to the stream.',
          groupBy: [],
          helpCenterPath: '/real-time-metrics/data-stream/requests/total-data-streamed',
          id: '352149351588430415',
          isTopX: false,
          label: 'Total Data Streamed',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          aggregationType: 'sum',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'streamedLines'
            }
          ],
          chartOwner: 'azion',
          columns: 6,
          dashboardId: '352149476039721549',
          dataUnit: 'count',
          dataset: 'dataStreamedMetrics',
          description:
            'Quantity of requests that were processed. Displays the total amount of requests.',
          groupBy: [],
          helpCenterPath: '/real-time-metrics/data-stream/requests/total-requests',
          id: '352234687543902797',
          isTopX: false,
          label: 'Total Requests',
          limit: 5000,
          orderDirection: 'ASC',
          rotated: false,
          type: 'line',
          variationType: 'regular',
          xAxis: 'ts'
        },
        {
          id: '424388331488145487',
          chartOwner: 'azion',
          label: 'Top WAF Threat Requests by IP',
          description:
            'Sum of requests identified as threats by WAF, broken down by the top IP addresses responsible for the most flagged requests.',
          aggregationType: 'sum',
          columns: 6,
          type: 'ordered-bar',
          xAxis: 'cat',
          isTopX: true,
          rotated: true,
          dataUnit: 'count',
          dataset: 'httpBreakdownMetrics',
          aggregations: [
            {
              aggregation: 'sum',
              variable: 'wafThreatRequests'
            }
          ],
          filters: {},
          limit: 10,
          groupBy: ['remoteAddress'],
          fields: ['remoteAddress'],
          orderDirection: 'DESC',
          dashboardId: '357548675837198934',
          variationType: 'regular',
          helpCenterPath: '/real-time-metrics/threats/breakdown/top-waf-threat-requests-by-ip'
        }
      ]

      expect(REPORTS).toEqual(reports)
    })
  })
})
