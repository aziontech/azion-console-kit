import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeEventsApi'
import { makeEventsListBaseUrl } from './make-events-list-base-url'

export const listEventsService = async () => {
  const offSetEnd = new Date()
  const offSetStart = new Date(
    Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
  )
  const payload = {
    operatioName: 'ActivityHistory',
    query: `
    query ActivityHistory {
      activityHistoryEvents(
        aggregate: {sum: requests}
        offset: 0
        limit: 1000, 
        filter: {
          tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"}
          # tsNe: "2023-10-21T01:00:06Z"
          # tsIn: ["2023-10-21T03:00:10Z", "2023-10-21T04:00:16Z", "2023-10-21T06:00:07Z"]
          # titleIlike: "%BOtM%"
        },
        orderBy: [ts_DESC]
        ) 
      {	
        sum
        ts
        title
        comment
        type
        authorName
        authorEmail
        accountId
      }
    }
    `,
    variables: null
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN)
  )
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEvents = httpResponse.body.data.activityHistoryEvents.map((element) => ({
    ts: Intl.DateTimeFormat('us', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date(element.ts)),
    title: element.title,
    type: element.type,
    author_name: element.authorName,
    author_email: element.authorEmail
  }))

  return {
    body: parsedEvents,
    statusCode: httpResponse.statusCode
  }
}
