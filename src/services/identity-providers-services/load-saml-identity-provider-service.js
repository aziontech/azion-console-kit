import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const loadSAMLIdentityProviderService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/saml2/${payload.id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const {
    uuid,
    name,
    is_active,
    sign_in_url,
    entity_id_url,
    login_url,
    acs_url,
    metadata_url,
    signature_algorithm,
    scim_integration,
    scim_url
  } = httpResponse.body

  const parsedBody = {
    uuid,
    name,
    active: is_active,
    signInUrl: sign_in_url,
    entityIdUrl: entity_id_url,
    loginUrl: login_url,
    acsUrl: acs_url,
    metadataUrl: metadata_url,
    signatureAlgorithm: signature_algorithm,
    scimIntegration: scim_integration,
    scimUrl: scim_url,
    identityProviderType: 'SAML'
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
