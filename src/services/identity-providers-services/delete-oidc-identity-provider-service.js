import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'
import * as Errors from '@/services/axios/errors'
export const deleteOIDCIdentityProviderService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/oidc/${id}`,
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
      return 'Identity Provider successfully deleted'
    case 400:
      throw new Errors.InvalidApiRequestError().message
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
