import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeEdgeDNSRecordsBaseUrl } from './make-edge-dns-records-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const editRecordsService = async (payload) => {
  const adaptPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSRecordsBaseUrl()}/${payload.edgeDNSId}/records/${payload.id}`,
    method: 'PUT',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    record_type: payload.selectedRecordType,
    entry: payload.name,
    answers_list: payload.value.split('\n'),
    ttl: payload.ttl,
    policy: payload.selectedPolicy,
    weight: payload.weight,
    description: payload.description
  }
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
    case 200:
      return 'Edge DNS Record has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
