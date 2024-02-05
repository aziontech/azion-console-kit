import * as Errors from '@/services/axios/errors'
import axios from 'axios'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSBaseUrl } from './make-intelligent-dns-base-url'

const cancelRequest = axios.CancelToken
const source = cancelRequest.source()

export const searchIdnsService = async ({ name }) => {
  source.cancel()

  const searchParams = makeSearchParams({ name })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSBaseUrl()}?${searchParams.toString()}`,
    method: 'GET',
    cancelToken: source.token
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: {
      results: httpResponse.results,
      totalPages: httpResponse.total_pages
    },
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ name, pageSize = 200 }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page_size', pageSize)
  searchParams.set('name', name)

  return searchParams
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      throw new Errors.InvalidApiRequestError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
