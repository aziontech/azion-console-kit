import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import * as Errors from '@/services/axios/errors'
import { buildSummary } from '@/helpers'
import { getCurrentTimezone } from '@/helpers'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

export const listEdgeFunctionsConsole = async (filter) => {
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
    dataset: 'functionConsoleEvents',
    limit: 10000,
    fields: ['configurationId', 'functionId', 'id', 'level', 'lineSource', 'ts', 'line'],
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (body) => {
  const functionConsoleEventsList = body.data?.functionConsoleEvents
  const parser = functionConsoleEventsList?.length
    ? functionConsoleEventsList.map((functionConsoleEvent) => ({
        summary: buildSummary(functionConsoleEvent, shouldLimitRequestUri, shouldShowTsColumn),
        configurationId: functionConsoleEvent.configurationId,
        line: functionConsoleEvent.line,
        id: generateCurrentTimestamp(),
        tsFormat: getCurrentTimezone(functionConsoleEvent.ts),
        ts: functionConsoleEvent.ts
      }))
    : []

  return {
    data: parser
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
