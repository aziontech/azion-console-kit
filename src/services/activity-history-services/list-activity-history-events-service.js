import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeEventsApi'
import { makeEventsListBaseUrl } from './make-events-list-base-url'

export const listActivityHistoryEventsService = async ({
  apiClient = graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN),
  offset = 0,
  limit = 1000,
  search = ''
} = {}) => {
  const offSetEnd = new Date()
  const offSetStart = new Date(
    Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
  )
  const payload = {
    operatioName: 'ActivityHistory',
    query: `query ActivityHistory { activityHistoryEvents( offset: ${offset} limit: ${limit}, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
  }

  if (search) {
    payload.query = `query ActivityHistory { activityHistoryEvents( offset: ${offset} limit: ${limit}, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } titleLike: "%${search}%" }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
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
  const parsedEvents =
    httpResponse.body.data?.activityHistoryEvents?.map((element) => ({
      ts: Intl.DateTimeFormat('us', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date(element.ts)),
      title: element.title,
      type: element.type,
      authorName: element.authorName,
      authorEmail: element.authorEmail
    })) || []

  return {
    body: parsedEvents,
    statusCode: httpResponse.statusCode
  }
}
