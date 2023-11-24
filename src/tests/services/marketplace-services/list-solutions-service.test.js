import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listSolutionsService } from '@/services/marketplace-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  solutionSample: {
    id: 9,
    name: 'JWT',
    slug: 'jwt',
    headline: 'JSON Web Token is an Internet standard for creating data with optional signature',
    vendor: {
      name: 'Azion',
      slug: 'azion',
      url: 'https://azion.com',
      icon: 'https://azion-images-stage.s3.amazonaws.com/media/1214e.png'
    },
    category: [
      {
        name: 'Security',
        slug: 'security'
      },
      {
        name: 'Performance',
        slug: 'performance'
      },
      {
        name: 'Networking',
        slug: 'networking'
      }
    ],
    new_release: true,
    solution_reference_id: '123',
    featured: false,
    updated_at: '12/11/20, 13:40PM',
    is_launched: true,
    dependencies_by_client: [],
    instance_type: {
      name: 'Edge Function',
      slug: 'edge_function',
      is_template: false
    }
  }
}

const makeSut = () => {
  const sut = listSolutionsService

  return {
    sut
  }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/?`,
      headers: { 'Mktp-Api-Context': 'onboarding' },
      method: 'GET'
    })
  })

  it('should call api with search params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({ search: 'Hello' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/?search=Hello`,
      headers: { 'Mktp-Api-Context': 'onboarding' },
      method: 'GET'
    })
  })

  it('should call api with category params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({ category: 'security' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/?category=security`,
      headers: { 'Mktp-Api-Context': 'onboarding' },
      method: 'GET'
    })
  })

  it('should call api with type params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({ type: 'marketplace' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/?`,
      headers: { 'Mktp-Api-Context': 'marketplace' },
      method: 'GET'
    })
  })

  it('should parsed correctly each solution record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [fixtures.solutionSample]
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        headline: fixtures.solutionSample.headline,
        id: fixtures.solutionSample.id,
        name: fixtures.solutionSample.name,
        referenceId: fixtures.solutionSample.solution_reference_id,
        vendor: fixtures.solutionSample.vendor,
        released: fixtures.solutionSample.new_release,
        featured: fixtures.solutionSample.featured
      }
    ])
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
