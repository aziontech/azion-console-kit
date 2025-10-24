import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'
import { capitalizeFirstLetter } from '@/helpers'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const loadOIDCIdentityProviderService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/oidc/${payload.id}`,
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
    authorization_url,
    userinfo_url,
    token_url,
    client_id,
    scopes,
    login_url,
    redirect_url,
    response_mode,
    scim_integration,
    scim_url
  } = httpResponse.body

  const parsedBody = {
    uuid,
    name,
    active: is_active,
    authorizationUrl: authorization_url,
    userInfoUrl: userinfo_url,
    tokenUrl: token_url,
    clientId: client_id,
    scopes,
    loginUrl: login_url,
    redirectUrl: redirect_url,
    responseMode: capitalizeFirstLetter(response_mode),
    scimIntegration: scim_integration,
    scimUrl: scim_url,
    identityProviderType: 'OIDC'
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
