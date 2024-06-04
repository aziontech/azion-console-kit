import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listSolutionsService } from '@/services/solutions-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  solutionSample: {
    id: 123,
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
        name: 'Build',
        slug: 'build'
      }
    ],
    new_release: true,
    solution_reference_id: '123',
    featured: false,
    updated_at: '12/11/20, 13:40PM',
    instance_type: {
      name: 'Edge Function',
      slug: 'edge_function',
      is_template: false
    }
  },
  formattedSolutions: [
    {
      id: '123',
      name: 'JWT',
      referenceId: '123',
      vendor: {
        name: 'Azion',
        slug: 'azion',
        url: 'https://azion.com',
        icon: 'https://azion-images-stage.s3.amazonaws.com/media/1214e.png'
      },
      slug: 'jwt',
      headline: 'JSON Web Token is an Internet standard for creating data with optional signature',
      featured: false,
      released: true,
      instanceType: {
        name: 'Edge Function',
        isTemplate: false
      },
      category: 'Build',
      updatedAt: '12/11/20, 13:40PM'
    }
  ]
}

const makeSut = () => {
  const sut = listSolutionsService

  return {
    sut
  }
}

describe('SolutionsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/`,
      headers: { 'Mktp-Api-Context': 'onboarding' },
      method: 'GET'
    })
  })

  it('should call api with group params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    await sut({ group: 'team' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/?group=team`,
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

    await sut({ type: 'compute' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/solution/`,
      headers: { 'Mktp-Api-Context': 'compute' },
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

    result.sort((serviceA, serviceB) => serviceA.name.localeCompare(serviceB.name))

    expect(result).toEqual(fixtures.formattedSolutions)
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
