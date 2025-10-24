import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAccountSettingsBaseUrl } from './make-account-settings-base-url'

export const updateAccountSettingsService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeAccountSettingsBaseUrl(),
    method: 'PATCH',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    postal_code: payload.postalCode,
    country: payload.country,
    region: payload.region,
    city: payload.city,
    address: payload.address,
    complement: payload.complement
  }
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
      return httpResponse.body.data
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
