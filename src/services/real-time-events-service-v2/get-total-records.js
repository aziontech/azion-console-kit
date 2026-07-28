import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { parseGraphQLResponse } from '@/services/real-time-events-service-v2/_shared/service/parse-graphql-response'

// ── DEV MOCK ────────────────────────────────────────────────────────────
// Use VITE_ENVIRONMENT (not MODE) so that production-targeted local dev
// sessions hit the real GraphQL API instead of the mock JSON.
const USE_MOCK =
  import.meta.env.MODE === 'development' && import.meta.env.VITE_ENVIRONMENT !== 'production'
// ── END DEV MOCK ────────────────────────────────────────────────────────

export const getTotalRecords = async ({ filter, dataset }) => {
  if (USE_MOCK && dataset === 'workloadEvents') {
    return '1.000'
  }

  const payload = adapt(filter, dataset)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseGraphQLResponse(httpResponse, (body) => adaptResponse(body, dataset))
}

const adapt = (filter, dataset) => {
  const table = {
    dataset: dataset,
    limit: 10000,
    fields: ['count']
  }
  return convertGQLTotalRecords(filter, table)
}

const adaptResponse = (body, dataset) => {
  const totalRecords = body.data[dataset][0].count
  const formattedBR = new Intl.NumberFormat('pt-BR').format(totalRecords)

  return formattedBR
}
