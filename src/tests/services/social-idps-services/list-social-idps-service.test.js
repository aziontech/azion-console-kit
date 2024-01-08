import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listSocialIdpsService } from '@/services/social-idps-services'

const mockPayload = {
  data: [
    {
      uuid: '123abc-123abc',
      name: 'Google',
      is_active: true,
      protocol: 'Social',
      login_url: '/some-url',
      slug: 'google'
    }
  ],
  formatted: [
    {
      uuid: '123abc-123abc',
      name: 'Google',
      isActive: true,
      protocol: 'Social',
      loginUrl: '/some-url',
      slug: 'google'
    }
  ]
}

const makeSut = () => {
  const sut = listSocialIdpsService

  return {
    sut
  }
}

describe('SocialIdpsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockPayload.data
    })

    const { sut } = makeSut()

    await sut()

    const version = 'v4'

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/identity_providers/social`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockPayload.data
    })
    const { sut } = makeSut()

    const body = await sut()

    expect(body).toStrictEqual(mockPayload.formatted)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
