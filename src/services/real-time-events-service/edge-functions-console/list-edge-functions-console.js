import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import * as Errors from '@/services/axios/errors'
import { getRecordsFound } from '@/helpers/get-records-found'
import { buildSummary } from '@/helpers'

export const listEdgeFunctionsConsole = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'cellsConsoleEvents',
    limit: 10000,
    fields: ['configurationId', 'functionId', 'id', 'level', 'line', 'lineSource', 'source', 'ts'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (body) => {
  const cellsConsoleEventsList = body.data?.cellsConsoleEvents
  const totalRecords = cellsConsoleEventsList?.length
  const parser = cellsConsoleEventsList?.length
    ? cellsConsoleEventsList.map((cellsConsoleEvents) => ({
        summary: buildSummary(cellsConsoleEvents),
        id: generateCurrentTimestamp(),
        tsFormat: convertValueToDate(cellsConsoleEvents.ts),
        ts: cellsConsoleEvents.ts
      }))
    : []

  return {
    data: parser,
    recordsFound: getRecordsFound(totalRecords)
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
