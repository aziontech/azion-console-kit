import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const editSAMLIdentityProviderService = async (payload) => {
  const adaptPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/saml2/${payload.uuid}`,
    method: 'PATCH',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}
const adapt = (payload) => {
  const { name, entityIdUrl, signInUrl, certificate } = payload

  const adaptedPayload = {
    name,
    entity_id_url: entityIdUrl,
    sign_in_url: signInUrl
  }

  if (certificate) {
    adaptedPayload.certificate = certificate
  }
  return adaptedPayload
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
      return 'Your SAML has been updated'
    case 400:
      const errorMessage = httpResponse.body.detail[0]
      throw new Error(errorMessage).message
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
