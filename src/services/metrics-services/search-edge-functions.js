import * as Errors from '@/services/axios/errors'
import axios from 'axios'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'

const cancelRequest = axios.CancelToken
const source = cancelRequest.source()

export const searchEdgeFunctionsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
} = {}) => {
  source.cancel()

  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET',
    cancelToken: source.token
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeFunction = httpResponse.body.results?.map((edgeFunction) => ({
    value: edgeFunction.id,
    label: edgeFunction.name
  }))

  return {
    body: parsedEdgeFunction,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  orderBy && searchParams.set('order_by', orderBy)
  sort && searchParams.set('sort', sort)
  page && searchParams.set('page', page)
  pageSize && searchParams.set('page_size', pageSize)

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
