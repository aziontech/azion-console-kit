import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { useGraphQLStore } from '@/stores/graphql-query'

export const getTotalRecords = async (filter, dataset) => {
  console.log('filter', filter)
  const payload = adapt(filter, dataset)
  console.log('payload', payload)
  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(httpResponse, dataset)
}

const adapt = (filter, dataset) => {
  const table = {
    dataset: dataset,
    limit: 10000,
    fields: ['count'],
  }
  return convertGQLTotalRecords(filter, table)
}

const adaptResponse = (httpResponse, dataset) => {
  const { body } = httpResponse
  const totalRecords = body.data[dataset]?.length
  console.log(body.data[dataset])

  return {
    total: totalRecords
  }
}
