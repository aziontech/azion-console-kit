import * as Errors from '@/services/axios/errors'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

/**
 * Function to load metrics data.
 *
 * @param {Object} query - The query object containing data to be loaded.
 * @return {Promise<Object>} A Promise that resolves to the parsed HTTP response.
 */
export async function loadFieldsEventsData({ query, signal }) {
  const response = await AxiosHttpClientAdapter.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: {
      query
    },
    signal
  })

  return parseHttpResponse(response)
}

/**
 * Parses the HTTP response and returns the data or throws an error based on the status code.
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @return {any} The data from the response body if the status code is 200.
 * @throws {Error} An InternalServerError if the status code is 500.
 * @throws {Error} An UnexpectedError for any other status code.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body.data
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
