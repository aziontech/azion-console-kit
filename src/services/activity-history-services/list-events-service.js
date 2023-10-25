import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeEventsApi'
import { makeEventsListBaseUrl } from './make-events-list-base-url'

export const listEventsService = async () => {
  const payload = {
    operatioName: 'ActivityHistory',
    query: `query EventsQuery {\n  httpEvents(\n    limit: 5, \n    filter: {\n      tsRange: {begin:"2022-11-20T10:10:10", end:"2022-11-27T10:10:10"}    },   aggregate: {count: requestUri}\n    groupBy: [requestUri]\n    orderBy: [count_DESC]\n    ) \n  { \n    requestUri\n    count\n  }\n}`,
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
  console.log(httpResponse)

  return {
    body: httpResponse.data,
    statusCode: httpResponse.statusCode
  }
}
