import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { launchSolutionService } from '@/services/marketplace-services'
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
  const sut = launchSolutionService

  return {
    sut
  }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const solution = fixtures.solutionSample
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: null
    })

    const { sut } = makeSut()

    await sut({
      vendor: solution.vendor.slug,
      solution: solution.slug
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/launch/${solution.vendor.slug}/${solution.slug}/latest`,
      method: 'POST'
    })
  })

  it('should return a feedback message on successfully created', async () => {
    const solution = fixtures.solutionSample
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: null
    })
    const { sut } = makeSut()

    const { feedback } = await sut({
      vendor: solution.vendor.slug,
      solution: solution.slug
    })

    expect(feedback).toBe('Integration installation was successful')
  })

  it('Should return an API error for status 400', async () => {
    const solution = fixtures.solutionSample
    const message = 'There was a problem in the process. Please try again in a few minutes.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: message
    })
    const { sut } = makeSut()

    const feedbackMessage = sut({
      vendor: solution.vendor.slug,
      solution: solution.slug
    })

    expect(feedbackMessage).rejects.toThrow(message)
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
      const solution = fixtures.solutionSample
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: []
      })
      const { sut } = makeSut()

      const response = sut({
        vendor: solution.vendor.slug,
        solution: solution.slug
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
