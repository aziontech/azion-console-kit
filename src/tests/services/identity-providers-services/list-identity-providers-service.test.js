import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listIdentityProvidersService } from '@/services/identity-providers-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  identityProvidersMock: [
    {
      uuid: 1,
      name: 'GitHub',
      protocol: 'OIDC',
      is_active: true
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
      body: fixtures.identityProvidersMock
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual(fixtures.parsedIdentityProvidersMock)
  })
})
