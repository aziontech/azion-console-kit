import { AxiosHttpClientAdapter } from '../../axios/AxiosHttpClientAdapter'
import * as Errors from '../../axios/errors'
import { makeEdgeDNSBaseUrl } from './make-edge-dns-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const createEdgeDNSZonesService = async (payload) => {
  const adaptPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSBaseUrl()}/zones`,
    method: 'POST',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    domain: payload.domain,
    active: payload.isActive
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return {
        feedback: 'Your Edge DNS Zone has been created',
        urlToEditView: `/edge-dns/edit/${httpResponse.body.data.id}`
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
