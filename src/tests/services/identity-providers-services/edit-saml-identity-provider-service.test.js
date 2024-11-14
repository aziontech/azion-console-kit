import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editSAMLIdentityProviderService } from '@/services/identity-providers-services/edit-saml-identity-provider-service'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  samlProviderMock: {
    uuid: '12345',
    name: 'Example SAML Provider',
    entityIdUrl: 'https://example.com/entityid',
    signInUrl: 'https://example.com/signin',
    certificate: 'base64certificate=='
  }
}

const makeSut = () => {
  const sut = editSAMLIdentityProviderService
  return {
    sut
  }
}

describe('editSAMLIdentityProviderService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.samlProviderMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: expect.stringContaining(`/saml2/${fixtures.samlProviderMock.uuid}`),
      method: 'PATCH',
      body: {
        name: fixtures.samlProviderMock.name,
        entity_id_url: fixtures.samlProviderMock.entityIdUrl,
        sign_in_url: fixtures.samlProviderMock.signInUrl,
        certificate: fixtures.samlProviderMock.certificate
      }
    })
  })

  it('should return a success message when the request is successful', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.samlProviderMock)

    expect(result).toBe('Your SAML has been updated')
  })

  it('should throw an error with the message from the response body when statusCode is 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: ['Invalid request parameters.']
      }
    })

    const { sut } = makeSut()
    const response = sut(fixtures.samlProviderMock)

    await expect(response).rejects.toThrow('Invalid request parameters.')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })

      const { sut } = makeSut()
      const response = sut(fixtures.samlProviderMock)

      await expect(response).rejects.toThrow(expectedError)
    }
  )
})
