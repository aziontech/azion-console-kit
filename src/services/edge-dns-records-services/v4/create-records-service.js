import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeEdgeDNSRecordsBaseUrl } from './make-edge-dns-records-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const createRecordsService = async (payload) => {
  const adaptPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSRecordsBaseUrl()}/${payload.edgeDNSID}/records`,
    method: 'POST',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse, payload.id)
}

const adapt = (payload) => {
  return {
    record_type: payload.selectedRecordType,
    policy: payload.selectedPolicy,
    entry: payload.name,
    answers_list: [payload.value],
    ttl: payload.ttl,
    description: payload.description,
    weight: payload.weight
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse, edgeDNSID) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Edge DNS Record has been created',
        urlToEditView: `/edge-dns/edit/${edgeDNSID}/records/edit/${httpResponse.body.data.id}`
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
  }
}
