const HELP_CENTER_URLS = {
  dataStream: {
    requests: {
      totalDataStreamed: '/real-time-metrics/data-stream/requests/total-data-streamed',
      totalRequests: '/real-time-metrics/data-stream/requests/total-requests'
    }
  },
  edgeApplications: {
    bandwidthSaving: {
      bandwidthSaving: '/real-time-metrics/edge-applications/bandwidth-saving/bandwidth-saving'
    },
    dataTransferred: {
      bandwidthOffloaded:
        '/real-time-metrics/edge-applications/data-transferred/bandwidth-offloaded',
      edgeCache: '/real-time-metrics/edge-applications/data-transferred/edge-cache',
      edgeOffload: '/real-time-metrics/edge-applications/data-transferred/edge-offload',
      missedBandwidth: '/real-time-metrics/edge-applications/data-transferred/missed-bandwidth',
      missedData: '/real-time-metrics/edge-applications/data-transferred/missed-data',
      savedBandwidth: '/real-time-metrics/edge-applications/data-transferred/saved-bandwidth',
      savedData: '/real-time-metrics/edge-applications/data-transferred/saved-data',
      totalBandwidthUsage:
        '/real-time-metrics/edge-applications/data-transferred/total-bandwidth-usage'
    },
    requests: {
      missedRequestsPerSecond:
        '/real-time-metrics/edge-applications/requests/missed-requests-per-second',
      missedRequests: '/real-time-metrics/edge-applications/requests/missed-requests',
      requestsByMethod: '/real-time-metrics/edge-applications/requests/requests-by-method',
      averageRequestTime: '/real-time-metrics/edge-applications/requests/average-request-time',
      requestsOffloaded: '/real-time-metrics/edge-applications/requests/requests-offloaded',
      requestsPerSecondOffloaded:
        '/real-time-metrics/edge-applications/requests/requests-per-second-offloaded',
      savedRequestsPerSecond:
        '/real-time-metrics/edge-applications/requests/saved-requests-per-second',
      savedRequests: '/real-time-metrics/edge-applications/requests/saved-requests',
      totalRequestsPerSecond:
        '/real-time-metrics/edge-applications/requests/total-requests-per-second',
      totalRequests: '/real-time-metrics/edge-applications/requests/total-requests'
    },
    statusCodes: {
      httpStatusCodes2xx: '/real-time-metrics/edge-applications/status-codes/http-status-codes-2xx',
      httpStatusCodes3xx: '/real-time-metrics/edge-applications/status-codes/http-status-codes-3xx',
      httpStatusCodes4xx: '/real-time-metrics/edge-applications/status-codes/http-status-codes-4xx',
      httpStatusCodes5xx: '/real-time-metrics/edge-applications/status-codes/http-status-codes-5xx'
    }
  },
  edgeFunctions: {
    invocations: {
      totalInvocations: '/real-time-metrics/edge-functions/invocations/total-invocations'
    }
  },
  imageProcessor: {
    requests: {
      totalRequestsPerSecond:
        '/real-time-metrics/image-processor/requests/total-requests-per-second',
      totalRequests: '/real-time-metrics/image-processor/requests/total-requests'
    }
  },
  edgeDns: {
    standardQueries: {
      totalQueries: '/real-time-metrics/edge-dns/standard-queries/total-queries'
    }
  },
  tieredCache: {
    cachingOffload: {
      tieredCache: '/real-time-metrics/tiered-cache/caching-offload/tiered-cache',
      tieredCacheOffload: '/real-time-metrics/tiered-cache/caching-offload/tiered-cache-offload'
    }
  },
  waf: {
    threats: {
      crossSiteScriptingXssThreats:
        '/real-time-metrics/waf/threats/cross-site-scripting-xss-threats',
      otherThreats: '/real-time-metrics/waf/threats/other-threats',
      remoteFileInclusionRfiThreats:
        '/real-time-metrics/waf/threats/remote-file-inclusion-rfi-threats',
      sqlInjectionThreats: '/real-time-metrics/waf/threats/sql-injection-threats',
      threatsVsRequests: '/real-time-metrics/waf/threats/threats-vs-requests'
    }
  },
  botManager: {
    botManagerOverview: {
      badBotHits: '/real-time-metrics/bot-manager-advanced/overview/bad-bot-hits',
      goodBotHits: '/real-time-metrics/bot-manager-advanced/overview/good-bot-hits',
      botHits: '/real-time-metrics/bot-manager-advanced/overview/bot-hits',
      transactions: '/real-time-metrics/bot-manager-advanced/overview/transactions',
      botTraffic: '/real-time-metrics/bot-manager-advanced/overview/bot-traffic',
      topBotAction: '/real-time-metrics/bot-manager-advanced/overview/top-bot-action',
      botCaptchaLine: '/real-time-metrics/bot-manager-advanced/overview/bot-captcha-line-graph',
      topBotCaptchaPie:
        '/real-time-metrics/bot-manager-advanced/overview/top-bot-captcha-pie-graph',
      topBotClassification:
        '/real-time-metrics/bot-manager-advanced/overview/top-bot-classifications',
      botActivityMap: '/real-time-metrics/bot-manager-advanced/overview/bot-activity-map'
    },
    botManagerBreakdown: {
      impactedUrls: '/real-time-metrics/bot-manager-advanced/breakdown/impacted-urls',
      topBadBotIps: '/real-time-metrics/bot-manager-advanced/breakdown/top-bad-bot-ips',
      topImpactedUrls: '/real-time-metrics/bot-manager-advanced/breakdown/top-impacted-urls'
    }
  },
  threatsBreakdown: {
    threatsRequestsByIps: '/real-time-metrics/threats/breakdown'
  }
}

export default HELP_CENTER_URLS
