import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listIdentityProvidersService } from '@/services/identity-providers-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  activeIdentityProvidersMock: [
    {
      uuid: 1,
      name: 'GitHub',
      protocol: 'OIDC',
      is_active: true
    }
  ],
  inactiveIdentityProvidersMock: [
    {
      uuid: 1,
      name: 'GitHub',
      protocol: 'OIDC',
      is_active: false
    }
  ],
  parsedDefaultActiveIdentityProviderMock: [
    {
      name: {
        text: 'Azion SSO',
        tagProps: { value: 'Active', severity: 'success' }
      },
      protocol: 'Internal Identity Source',
      isActive: true,
      id: 'azion-default-sso'
    },
    {
      name: {
        text: 'GitHub',
        tagProps: {}
      },
      protocol: 'OIDC',
      isActive: false,
      id: 1
    }
  ],
  parsedIdentityProvidersMock: [
    {
      name: {
        text: 'GitHub',
        tagProps: {
          value: 'Active',
          severity: 'success'
        }
      },
      protocol: 'OIDC',
      isActive: true,
      id: 1
    },
    {
      name: {
        text: 'Azion SSO',
        tagProps: {}
      },
      protocol: 'Internal Identity Source',
      isActive: false,
      id: 'azion-default-sso'
    }
  ]
}

const makeSut = () => {
  const sut = listIdentityProvidersService

  return {
    sut
  }
}

describe('IdentityProvidersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })
    const { sut } = makeSut()
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'iam/identity_providers',
      method: 'GET'
    })
  })

  it('should parsed correctly all returned identity providers', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.activeIdentityProvidersMock
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual(fixtures.parsedIdentityProvidersMock)
  })

  it('should set the default identity provider as active when there is no active identity provider', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.inactiveIdentityProvidersMock
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual(fixtures.parsedDefaultActiveIdentityProviderMock)
  })
})
