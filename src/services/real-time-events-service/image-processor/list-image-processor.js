import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDateByUserTimezone } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'
import { getUserTimezone } from '../get-timezone'

export const listImageProcessor = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'imagesProcessedEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'host',
      'requestUri',
      'status',
      'bytesSent',
      'httpReferer',
      'ts',
      'httpUserAgent'
    ],
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const timezone = getUserTimezone()

  const data = response.data.imagesProcessedEvents?.map((imagesProcessedEvents) => ({
    id: generateCurrentTimestamp(),
    configurationId: imagesProcessedEvents.configurationId,
    httpUserAgent: imagesProcessedEvents.httpUserAgent,
    httpReferer: imagesProcessedEvents.httpReferer,
    summary: buildSummary(imagesProcessedEvents),
    ts: imagesProcessedEvents.ts,
    tsFormat: convertValueToDateByUserTimezone(imagesProcessedEvents.ts, timezone)
  }))

  return {
    data
  }
}

const parseHttpResponse = (response) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return adaptResponse(body)
    case 400:
      const apiError = body.detail
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const forbiddenError = body.detail
      throw new Error(forbiddenError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
