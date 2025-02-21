import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { useGraphQLStore } from '@/stores/graphql-query'

export const getTotalRecords = async ({ filter, dataset }) => {
  const payload = adapt(filter, dataset)
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
    fields: ['count']
  }
  return convertGQLTotalRecords(filter, table)
}

const adaptResponse = (httpResponse, dataset) => {
  const { body } = httpResponse
  const totalRecords = body.data[dataset][0].count
  const formattedBR = new Intl.NumberFormat('pt-BR').format(totalRecords)

  return formattedBR
}
