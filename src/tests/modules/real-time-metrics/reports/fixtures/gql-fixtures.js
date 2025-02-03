const REPORT_GQL_FIXTURES = [
  {
    id: '356217848089018959',
    label: 'Edge Cache',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          dataTransferredTotal
dataTransferredOut
dataTransferredIn
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '356220228059791957',
    label: 'Edge Offload',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          offload
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '356220625185931855',
    label: 'Saved Data',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          savedData
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '356220671983878733',
    label: 'Missed Data',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          missedData
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357550842741523030',
    label: 'Total Bandwidth Usage',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          bandwidthTotal
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357550842741523029',
    label: 'Bandwidth Offloaded',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          bandwidthOffload
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357817189325079119',
    label: 'Saved Bandwidth',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          bandwidthSavedData
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357817270971400783',
    label: 'Missed Bandwidth',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          bandwidthMissedData
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357822254142194261',
    label: 'Total Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          edgeRequestsTotal
httpsRequestsTotal
httpRequestsTotal
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357822606596899407',
    label: 'Requests Offloaded',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsOffloaded
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357823841952596559',
    label: 'Saved Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          savedRequests
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357823947031446101',
    label: 'Missed Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          missedRequests
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357824034956640847',
    label: 'Total Requests per Second',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          edgeRequestsTotalPerSecond
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357824230790791757',
    label: 'Requests per Second Offloaded',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsPerSecondOffloaded
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357824321753711189',
    label: 'Saved Requests per Second',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          savedRequestsPerSecond
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357824572487107151',
    label: 'Missed Requests per Second',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          missedRequestsPerSecond
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357825388709151309',
    label: 'Requests by Method',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsHttpMethodGet
requestsHttpMethodPost
requestsHttpMethodHead
requestsHttpMethodOthers
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357824919768138325',
    label: 'HTTP Status Codes 2XX',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsStatusCode200
requestsStatusCode204
requestsStatusCode206
requestsStatusCode2xx
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357825000731837013',
    label: 'HTTP Status Codes 3XX',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsStatusCode301
requestsStatusCode302
requestsStatusCode304
requestsStatusCode3xx
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357825058049098319',
    label: 'HTTP Status Codes 4XX',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsStatusCode400
requestsStatusCode403
requestsStatusCode404
requestsStatusCode4xx
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357825090550760015',
    label: 'HTTP Status Codes 5XX',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestsStatusCode500
requestsStatusCode502
requestsStatusCode503
requestsStatusCode5xx
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357843490139275861',
    label: 'Bandwidth Saving',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          bandwidthImagesProcessedSavedData
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357826217661956693',
    label: 'Tiered Cache',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      l2CacheMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          dataTransferredTotal
dataTransferredOut
dataTransferredIn
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357826288204907093',
    label: 'Tiered Cache Offload',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      l2CacheMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          offload
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357843490139298763',
    label: 'Total Invocations',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      edgeFunctionsMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          edgeApplicationInvocations
edgeFirewallInvocations
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357844490139298789',
    label: 'Total Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      imagesProcessedMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
or: {
status: 304
statusRange: {
begin: 199
end: 299

}

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357843490195298789',
    label: 'Total Requests per Second',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      imagesProcessedMetrics (
        limit: 5000
        aggregate: {rate: requests 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
or: {
status: 304
statusRange: {
begin: 200
end: 299

}

}

        }
        ) {
          rate
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357822591213814093',
    label: 'Total Attacks',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357842594513814093',
    label: 'Threats vs Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          wafRequestsAllowed
wafRequestsBlocked
wafRequestsThreat
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357842775438262861',
    label: 'Cross-Site scripting (XSS) Threats',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          wafRequestsXssAttacks
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357842594513814012',
    label: 'Remote File Inclusion (RFI) Threats',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          wafRequestsRfiAttacks
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357842833307075157',
    label: 'SQL Injection Threats',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          wafRequestsSqlAttacks
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357842851576414805',
    label: 'Other Threats',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpMetrics (
        limit: 5000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          wafRequestsOthersAttacks
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '357843490139298789',
    label: 'Total Queries',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      idnsQueriesMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '892249168369791027',
    label: 'Bad Bot Hits',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
classifiedEq: "bad bot"

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '934654293238823255',
    label: 'Good Bot Hits',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
classifiedEq: "good bot"

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '259047966206560862',
    label: 'Bot Hits',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
classifiedIn: ["bad bot","good bot"]

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '541669034905662013',
    label: 'Transactions',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts]
        orderBy: [ts_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '329891149133127508',
    label: 'Bot Traffic',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 10000
        aggregate: {sum: requests 
}
        groupBy: [ts, classified]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
classified
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '577704475532819772',
    label: 'Bot Action',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 10
        aggregate: {sum: requests 
}
        groupBy: [action]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
not: {
botCategoryIn: ["","Non-Bot Like"]

}

        }
        ) {
          action
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '071851224118431167',
    label: 'Bot CAPTCHA',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [ts, challengeSolved]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
challengeSolved
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '455330743572401794',
    label: 'Bot CAPTCHA',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 2
        aggregate: {sum: requests 
}
        groupBy: [challengeSolved]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          challengeSolved
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '424388331488145485',
    label: 'Bot Classifications',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 10
        aggregate: {sum: requests 
}
        groupBy: [botCategory]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
not: {
botCategoryIn: ["","Non-Bot Like"]

}

        }
        ) {
          botCategory
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '190246009413028885',
    label: 'Bot Activity Map',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerMetrics (
        limit: 5000
        aggregate: {sum: requests 
}
        groupBy: [geolocCountryName]
        orderBy: [sum_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}
classifiedIn: ["bad bot","good bot"]

        }
        ) {
          geolocCountryName
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '352149351588430415',
    label: 'Total Data Streamed',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      dataStreamedMetrics (
        limit: 5000
        aggregate: {sum: dataStreamed 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '352234687543902797',
    label: 'Total Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      dataStreamedMetrics (
        limit: 5000
        aggregate: {sum: streamedLines 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '847143804009563421',
    label: 'Impacted URLs',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerBreakdownMetrics (
        limit: 10000
        
        groupBy: [ts]
        orderBy: [ts_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          uniqRequestUrl
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '978435123222265554',
    label: 'Top Bad Bot IPs',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerBreakdownMetrics (
        limit: 10
        aggregate: {sum: badBotRequests 
}
        groupBy: [remoteAddr]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          remoteAddr
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '1030427483148242',
    label: 'Top Impacted URLs',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      botManagerBreakdownMetrics (
        limit: 10
        aggregate: {sum: botRequests 
}
        groupBy: [requestUrl]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          requestUrl
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '352234687543902797',
    label: 'Total Requests',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      dataStreamedMetrics (
        limit: 5000
        aggregate: {sum: streamedLines 
}
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          sum
ts
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  },
  {
    id: '424388331488145487',
    label: 'Top WAF Threat Requests by IP',
    description: 'Top 10 IPs that generated the most threats identified by the WAF',
    gqlQuery: {
      query: `query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {
      httpBreakdownMetrics (
        limit: 10
        aggregate: {sum: wafThreatRequests 
}
        groupBy: [remoteAddress]
        orderBy: [sum_DESC]
        filter: {
          tsRange: {
begin: $tsRange_begin
end: $tsRange_end

}

        }
        ) {
          remoteAddress
sum
        }
      }`,
      variables: {
        tsRange_begin: '2024-01-01T12:00:00',
        tsRange_end: '2024-12-01T12:00:00'
      }
    }
  }
]

export default REPORT_GQL_FIXTURES
