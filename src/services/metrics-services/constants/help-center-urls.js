const HELP_CENTER_URLS = {
  dataStream: {
    requests: {
      totalDataStreamed: '/real-time-metrics/data-streaming/requests/total-data-streamed',
      totalRequests: '/real-time-metrics/data-streaming/requests/total-requests'
    }
  },
  edgeApplications: {
    bandwidthSaving: {
      bandwidthSaving: '/real-time-metrics/edge-applications/bandwidth-saving/bandwidth-saving'
    },
    dataTransferred: {
      bandwidthOffloaded:
        '/real-time-metrics/edge-applications/data-transferred/bandwidth-offloaded',
      edgeCaching: '/real-time-metrics/edge-applications/data-transferred/edge-caching',
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
      totalQueries: '/real-time-metrics/intelligent-dns/standard-queries/total-queries'
    }
  },
  l2Caching: {
    cachingOffload: {
      l2Caching: '/real-time-metrics/l2-caching/caching-offload/l2-caching',
      l2Offload: '/real-time-metrics/l2-caching/caching-offload/l2-offload'
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
  }
}

export default HELP_CENTER_URLS
