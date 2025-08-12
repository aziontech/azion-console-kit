import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { makeEventsListBaseUrl } from './make-events-list-base-url'
import graphQLApi from '../axios/makeEventsApi'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const getActivityHistoryTotalRecords = async (search = '') => {
  const dataset = 'activityHistoryEvents'
  const filter = {
    tsRange: {
      tsRangeBegin: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      tsRangeEnd: new Date().toISOString()
    }
  }
  if (search) {
    filter.titleLike = `%${search}%`
  }
  const payload = adapt(filter, dataset)
  const apiClient = graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN)

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    apiClient
  )
  return adaptResponse(httpResponse, dataset)
}

const adapt = (filter, dataset) => {
  const table = {
    dataset: dataset,
    limit: 10000,
    fields: ['count']
  }
  return convertGQLTotalRecords(filter, table)
}

const adaptResponse = (httpResponse, dataset) => {
  const { body } = httpResponse
  const totalRecords = body.data[dataset][0].count

  return totalRecords
}
