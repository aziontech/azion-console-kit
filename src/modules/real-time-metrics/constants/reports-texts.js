const REPORTS_TEXTS = {
  dataStream: {
    dataStreamed: {
      totalData: {
        description:
          'Quantity of data streamed to the configured connectors in bytes. Displays the total data sent to the stream.'
      }
    },
    dataStreamRequests: {
      totalRequests: {
        description:
          'Quantity of requests that were processed. Displays the total amount of requests.'
      }
    }
  },
  edgeApplications: {
    dataTransferred: {
      edgeCache: {
        description:
          'Sum of data transferred through Edge Cache. Displays the data in bytes divided by Data Transferred, Data Transferred In, and Data Transferred Out.'
      },
      edgeOffload: {
        description:
          'Percentage of data successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.'
      },
      savedData: {
        description:
          'Sum of data delivered by the edge without searching for the content on the origin server. Displays the data in bytes.'
      },
      missedData: {
        description:
          'Amount of data delivered by the edge after searching for the content on the origin server. Displays the data in bytes.'
      },
      totalBandwidthUsage: {
        description:
          'Average of bandwidth used while the edge delivers your content. Displays the total amount of bandwidth used.'
      },
      bandwidthOffloaded: {
        description:
          'Percentage of bandwidth successfully delivered by the edge without searching for the content on the origin server. Displays the data in percentages.'
      },
      savedBandwidth: {
        description:
          'Average of bandwidth delivered by the edge without searching for the content on the origin server. Displays the average of bandwidth saved.'
      },
      missedBandwidth: {
        description:
          'Average of bandwidth used by the origin server to search for content. Displays the average of bandwidth used.'
      }
    },
    requests: {
      totalRequests: {
        description:
          'Quantity of requests made to your domain. Displays the total amount of requests divided by Edge Requests Total, Https Requests Total, and Http Requests Total.'
      },
      requestsOffloaded: {
        description:
          'Percentage of requests delivered directly by the edge, without searching for the content on the origin server. Displays the data in percentages.'
      },
      savedRequests: {
        description:
          'Quantity of requests delivered by the edge without searching for the content on the origin server. Displays the total amount of requests saved.'
      },
      missedRequests: {
        description:
          'Amount of requests delivered by the edge after searching for the content on the origin server. Displays the sum of missed requests.'
      },
      totalRequestsPerSecond: {
        description:
          'Average of requests per second made from customers to your domain. Displays the average number of requests per second.'
      },
      requestsPerSecondOffloaded: {
        description:
          'Percentage of requests per second delivered directly by the edge without searching for the content on the origin server. Displays the average number of offloaded requests per second in percentages.'
      },
      savedRequestsPerSecond: {
        description:
          'Average of requests per second delivered by the edge without searching for the content on the origin server. Displays the average number of saved requests delivered.'
      },
      missedRequestsPerSecond: {
        description:
          'Average of requests per second delivered by the edge after searching for the content on the origin server. Displays the average number of missed requests per second.'
      }
    },
    statusCodes: {
      httpStatusCodes2xx: {
        description:
          'Indicates user requests that were received, understood, accepted, and processed by the server. Displays Requests Status Code 200, Requests Status Code 204, Requests Status Code 206, and Requests Status Code 2xx.'
      },
      httpStatusCodes3xx: {
        description:
          'Indicates user requests that were redirected and had to go through another stage to be delivered. Displays Requests Status Code 301, Requests Status Code 302, Requests Status Code 304, and Requests Status Code 3xx.'
      },
      httpStatusCodes4xx: {
        description:
          "Indicates errors that have occurred with user's requests. Displays Requests Status Code 400, Requests Status Code 403, Requests Status Code 404, and Requests Status Code 4xx."
      },
      httpStatusCodes5xx: {
        description:
          'Indicates the server failed to deliver an apparently valid request. Displays Requests Status Code 500, Requests Status Code 502, Requests Status Code 503, and Requests Status Code 5xx.'
      }
    },
    waf: {
      threatsVsRequests: {
        description:
          'Sum of attacks processed by WAF. Displays the total amount of Waf Requests Blocked, Waf Requests Threats, and Waf Requests Allowed.'
      },
      crossSiteScriptingXssThreats: {
        description:
          'Sum of Cross-Site Scripting attacks against your domains. Displays the total amount of threats.'
      },
      remoteFileInclusionRfiThreats: {
        description:
          'Sum of Remote File Inclusion attacks against your domains. Displays the total amount of threats.'
      },
      sqlInjectionThreats: {
        description:
          'Sum of SQL Injection attacks against your domains. Displays the total amount of threats.'
      },
      otherThreats: {
        description:
          'Sum of other types of attacks blocked by WAF. Displays the total amount of threats.'
      }
    },
    httpMethods: {
      requestsByMethod: {
        description:
          'Total requests made to your domain divided by the HTTP method used. Displays methods Requests Http Method Get, Requests Http Method Post, Requests Http Method Head, and Requests Http Method Others.'
      }
    },
    bandwidthSaving: {
      bandwidthSaving: {
        description:
          "Images that were processed and delivered by Image Processor. Displays domains' savings when transmitting images in bytes."
      }
    }
  },
  edgeFunctions: {
    invocations: {
      totalInvocations: {
        description:
          'Quantity of times an edge function has been executed. Displays the total amount of invocations divided by Edge Firewall Invocations and Edge Application Invocations.'
      }
    }
  },
  edgeDns: {
    standardQueries: {
      totalQueries: {
        description: 'Quantity of queries your DNS received. Displays the total amount of queries.'
      }
    }
  },
  imageProcessor: {
    requests: {
      totalRequests: {
        description:
          'Quantity of requests made to your content images being processed. Displays the total amount of requests.'
      },
      totalRequestsPerSecond: {
        description:
          'Requests per second made to your content images being processed. Displays the average number of requests per second.'
      }
    }
  },
  tieredCache: {
    cachingOffload: {
      tieredCache: {
        description:
          'Sum of data transferred through Tiered Cache. Displays the data in bytes divided by Data Transferred Total, Data Transferred In, and Data Transferred Out.'
      },
      tieredCacheOffload: {
        description:
          'Percentage of data successfully delivered by Tiered Cache to the edge without searching for the content on the origin server. Displays the average number of data in percentages.'
      }
    }
  },
  botManager: {
    botManagerSummary: {
      badBotHits: {
        description: 'Number of requests identified as bad bot'
      },
      goodBotHits: {
        description: 'Number of requests identified as good bot'
      },
      botHits: {
        description: 'Number of requests identified as bot'
      },
      transactions: {
        description: 'Number of requests evaluated by the Azion Bot Manager'
      },
      botTraffic: {
        description: 'Sum of requests grouped by classification'
      },
      botCaptcha: {
        description: 'Sum of CAPTCHA challenge results returned for requests classified as bots'
      },
      botAction: {
        description:
          'Action taken by the Azion Bot Manager for requests identified as bots, displayed in both absolute values and percentages'
      },
      top10BotClassification: {
        description: 'Number of requests by bot category'
      },
      top3BotCaptcha: {
        description: 'Number of requests identified as bots, grouped by CAPTCHA challenge result'
      },
      botActivityMap: {
        description: 'Sum of requests identified as bots, presented by the country of origin'
      }
    }
  }
}

export default REPORTS_TEXTS
