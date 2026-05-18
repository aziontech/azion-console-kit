import { convertGQLTotalRecords } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import * as Errors from '@/services/axios/errors'

export const getTotalRecords = async ({ filter, dataset }) => {
  const payload = adapt(filter, dataset)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse, dataset)
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

/**
 * Parses the HTTP response and returns the data or throws an error based on the status code.
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @return {any} The data from the response body if the status code is 200.
 * @throws {Error} An InternalServerError if the status code is 500.
 * @throws {Error} An UnexpectedError for any other status code.
 */
const parseHttpResponse = (response, dataset) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return adaptResponse(body, dataset)
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
