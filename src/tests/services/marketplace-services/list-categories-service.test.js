import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listCategoriesService } from '@/services/marketplace-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  sample: {
    name: 'Security',
    slug: 'security',
    solutions_count: 24
  }
}

const makeSut = () => {
  const sut = listCategoriesService
  return { sut }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'marketplace/categories/',
      method: 'GET'
    })
  })

  it('should parsed correctly each solution record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [fixtures.sample]
    })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        name: fixtures.sample.name,
        slug: fixtures.sample.slug,
        solutionsCount: fixtures.sample.solutions_count
      }
    ])
  })

  it('should parsed correctly empty list returned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([])
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
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
        statusCode,
        body: []
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
