import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadOIDCIdentityProviderService } from '@/services/identity-providers-services/load-oidc-identity-provider-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  oidcProviderMock: {
    id: '12345',
    uuid: '12345',
    name: 'Example OIDC Provider',
    is_active: true,
    authorization_url: 'https://example.com/auth',
    userinfo_url: 'https://example.com/userinfo',
    token_url: 'https://example.com/token',
    client_id: 'client-id',
    scopes: ['openid', 'profile', 'email'],
    login_url: 'https://example.com/login',
    redirect_url: 'https://example.com/redirect',
    response_mode: 'form_post',
    scim_integration: false,
    scim_url: null
  }
}

const makeSut = () => {
  const sut = loadOIDCIdentityProviderService
  return {
    sut
  }
}

describe('loadOIDCIdentityProviderService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.oidcProviderMock
    })

    const { sut } = makeSut()

    await sut({ id: fixtures.oidcProviderMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: expect.stringContaining(`/oidc/${fixtures.oidcProviderMock.id}`),
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.oidcProviderMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.oidcProviderMock.id })

    expect(result).toEqual({
      uuid: fixtures.oidcProviderMock.uuid,
      name: fixtures.oidcProviderMock.name,
      active: fixtures.oidcProviderMock.is_active,
      authorizationUrl: fixtures.oidcProviderMock.authorization_url,
      userInfoUrl: fixtures.oidcProviderMock.userinfo_url,
      tokenUrl: fixtures.oidcProviderMock.token_url,
      clientId: fixtures.oidcProviderMock.client_id,
      scopes: fixtures.oidcProviderMock.scopes,
      loginUrl: fixtures.oidcProviderMock.login_url,
      redirectUrl: fixtures.oidcProviderMock.redirect_url,
      responseMode: 'Form_post', // Note the capitalization as per the adapt function
      scimIntegration: fixtures.oidcProviderMock.scim_integration,
      scimUrl: fixtures.oidcProviderMock.scim_url,
      identityProviderType: 'OIDC'
    })
  })
})
