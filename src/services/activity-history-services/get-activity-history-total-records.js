import { makeEventsListBaseUrl } from './make-events-list-base-url'
import graphQLApi from '../axios/makeEventsApi'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const getActivityHistoryTotalRecords = async ({ search = '' }) => {
  const apiClient = graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN)
  const offSetEnd = new Date()
  const offSetStart = new Date(
    Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
  )
  const payload = {
    operatioName: 'ActivityHistory',
    query: `query ActivityHistory { activityHistoryEvents(aggregate: { count: rows }, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } }) { count } } `
  }

  if (search) {
    payload.query = `query ActivityHistory { activityHistoryEvents (aggregate: { count: rows }, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } or: [{ titleLike: "%${search}%" }, { commentLike: "%${search}%" }], }) { count } } `
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    apiClient
  )
  return adaptResponse(httpResponse)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse
  const totalRecords = body.data.activityHistoryEvents[0].count

  return totalRecords
}
