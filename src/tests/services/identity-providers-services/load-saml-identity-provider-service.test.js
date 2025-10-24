import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadSAMLIdentityProviderService } from '@/services/identity-providers-services/load-saml-identity-provider-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  samlProviderMock: {
    id: '12345',
    uuid: '12345',
    name: 'Example SAML Provider',
    is_active: true,
    sign_in_url: 'https://example.com/signin',
    entity_id_url: 'https://example.com/entityid',
    login_url: 'https://example.com/login',
    acs_url: 'https://example.com/acs',
    metadata_url: 'https://example.com/metadata',
    signature_algorithm: 'RSA-SHA256',
    scim_integration: false,
    scim_url: null
  }
}

const makeSut = () => {
  const sut = loadSAMLIdentityProviderService
  return {
    sut
  }
}

describe('loadSAMLIdentityProviderService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.samlProviderMock
    })

    const { sut } = makeSut()

    await sut({ id: fixtures.samlProviderMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: expect.stringContaining(`/saml2/${fixtures.samlProviderMock.id}`),
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.samlProviderMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.samlProviderMock.id })

    expect(result).toEqual({
      uuid: fixtures.samlProviderMock.uuid,
      name: fixtures.samlProviderMock.name,
      active: fixtures.samlProviderMock.is_active,
      signInUrl: fixtures.samlProviderMock.sign_in_url,
      entityIdUrl: fixtures.samlProviderMock.entity_id_url,
      loginUrl: fixtures.samlProviderMock.login_url,
      acsUrl: fixtures.samlProviderMock.acs_url,
      metadataUrl: fixtures.samlProviderMock.metadata_url,
      signatureAlgorithm: fixtures.samlProviderMock.signature_algorithm,
      scimIntegration: fixtures.samlProviderMock.scim_integration,
      scimUrl: fixtures.samlProviderMock.scim_url,
      identityProviderType: 'SAML'
    })
  })
})
