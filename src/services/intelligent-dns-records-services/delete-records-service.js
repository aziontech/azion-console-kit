import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSRecordsBaseUrl } from './make-intelligent-dns-records-base-url'

export const deleteRecordsService = async ({ recordID, intelligentDNSID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSRecordsBaseUrl()}/${intelligentDNSID}/records/${recordID}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 204:
      return 'Intelligent DNS Record successfully deleted'
    case 400:
      throw new Errors.NotFoundError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
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
