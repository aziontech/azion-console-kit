import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeRealTimePurgeBaseUrl } from './make-real-time-purge-service'

export const createRealTimePurgeService = async (payload) => {
  const bodyRequest = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeRealTimePurgeBaseUrl()}/${payload.purgeType}`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const request = {
    items: payload.argumentsPurge.trim().split('\n'),
    layer: payload.layer
  }

  return request
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'The purge is queued for execution. It’ll appear in the history once completed.',
        urlToEditView: `/real-time-purge`
      }
    case 400:
      const key = Object.keys(httpResponse.body)[0]
      const msg = httpResponse.body[key]
      throw new Error(msg).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const keyError = Object.keys(httpResponse.body)[0]
      throw new Error(httpResponse.body[keyError]).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
