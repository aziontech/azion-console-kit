import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeEventsListBaseUrl } from './make-events-list-base-url'

export const getActivityHistoryTotalRecords = async ({ filter, dataset }) => {
  const payload = adapt(filter, dataset)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeEventsListBaseUrl(),
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
