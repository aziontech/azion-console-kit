import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadSolutionService } from '@/services/marketplace-services'
import * as Errors from '@services/axios/errors'
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
    usage:
      '<p style="text-align:justify"><span style="font-size:11pt"><span style="font-family:Arial,sans-serif"><span style="color:#000000">Azion effectively provides support...</p>',
    new_release: true,
    overview:
      '<p style="text-align:justify"><span style="font-size:11pt"><span style="font-family:Arial,sans-serif"><span style="color:#000000">Azion effectively provides support...</p>',
    solution_reference_id: '123',
    featured: false,
    support:
      '<p style="text-align:justify"><span style="font-size:11pt"><span style="font-family:Arial,sans-serif"><span style="color:#000000">Azion effectively provides support...</p>',
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
  const sut = loadSolutionService

  return {
    sut
  }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const solution = fixtures.solutionSample
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: solution
    })

    const { sut } = makeSut()

    await sut({
      vendor: solution.vendor.slug,
      solution: solution.slug
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/${solution.vendor.slug}/${solution.slug}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    const solution = fixtures.solutionSample
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: solution
    })

    const { sut } = makeSut()
    const result = await sut({
      vendor: solution.vendor.slug,
      solution: solution.slug
    })

    expect(result).toEqual({
      id: solution.id,
      name: solution.name,
      referenceId: solution.solution_reference_id,
      vendor: solution.vendor,
      headline: solution.headline,
      version: solution.version,
      latestVersion: solution.latest_version,
      latestVersionChangelog: solution.latest_version_changelog,
      lastUpdate: solution.updated_at,
      usage: '<p ><span ><span ><span >Azion effectively provides support...</p>',
      overview: '<p ><span ><span ><span >Azion effectively provides support...</p>',
      support: '<p ><span ><span ><span >Azion effectively provides support...</p>',
      isPayAsYouGo: solution.is_pay_as_you_go,
      isLaunched: solution.is_launched,
      isUpdated: solution.is_updated,
      newLaunchFlow: solution.new_launch_flow,
      slug: solution.slug
    })
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
      const solution = fixtures.solutionSample
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: solution
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
