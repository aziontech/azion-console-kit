import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEventsListBaseUrl } from './make-events-list-service'
import graphQLApi from '../axios/makeEventsApi'

export const listRealTimePurgeService = async (
  apiClient = graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN)
) => {
  const offSetEnd = new Date()
  const offSetStart = new Date(
    Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
  )

  const payload = {
    operatioName: 'ActivityHistory',
    query: `query ActivityHistory { activityHistoryEvents( offset: 0 limit: 1000, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"} resourceTypeIn: ["Purge:cachekey", "Purge:url", "Purge:wildcard"] }, orderBy: [ts_DESC] ) { resourceType
      ts
      title
      comment
      type
      requestData
      authorName
      authorEmail
      accountId } } `
  }
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    apiClient
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const requestData = httpResponse.body.data.activityHistoryEvents.map((item) => {
    const [, type] = item.resourceType.split(':')
    const { items, layer } = JSON.parse(JSON.parse(item.requestData))
    return {
      type,
      arguments: items,
      layer,
      user: item.authorEmail,
      time: new Intl.DateTimeFormat('us', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date(item.ts))
    }
  })
  return {
    body: requestData,
    statusCode: httpResponse.statusCode
  }
}
