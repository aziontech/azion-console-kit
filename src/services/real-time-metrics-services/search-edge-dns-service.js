import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'

/*
  Cache strategy is used to prevent making multiple calls to the same endpoint under the same conditions.
*/
let cache

let prevParams = {}

export const searchEdgeDnsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
} = {}) => {
  const params = { orderBy, sort, page, pageSize }
  const isSameParams = JSON.stringify(params) === JSON.stringify(prevParams)

  if (!isSameParams || !cache) {
    prevParams = params
    const searchParams = makeSearchParams(params)

    let httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeEdgeDNSBaseUrl()}?${searchParams.toString()}`,
      method: 'GET'
    })

    httpResponse = adapt(httpResponse)

    return parseHttpResponse(httpResponse)
  }

  return cache
}

const adapt = (httpResponse) => {
  const parsedEdgeDns = httpResponse.body.results?.map((edgeDns) => ({
    value: edgeDns.id,
    label: edgeDns.name
  }))

  return {
    body: parsedEdgeDns,
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
      cache = httpResponse.body
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
