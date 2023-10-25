import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeEventsApi'
import { makeEventsListBaseUrl } from './make-events-list-base-url'

export const listEventsService = async () => {
  const payload = {
    operatioName: 'ActivityHistory',
    query: `query ActivityHistory {
        activityHistoryEvents(
          offset: 0
          limit: 100, 
          filter: {
            tsRange: {begin:"2023-10-21T00:28:00", end:"2023-10-23T00:30:00"}
            # tsNe: "2023-10-21T01:00:06Z"
            # tsIn: ["2023-10-21T03:00:10Z", "2023-10-21T04:00:16Z", "2023-10-21T06:00:07Z"]
            # titleIlike: "%BOtM%"
          },
          orderBy: [ts_ASC]
            ) 
        {	
          ts
          title
          comment
          type
          authorName
          authorEmail
              accountId
        }
      }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'PUT',
      body: payload
    },
    graphQLApi()
  )
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
    console.log(httpResponse );
  
    return {
      body: httpResponse.data,
      statusCode: httpResponse.statusCode
    }
  }
  

