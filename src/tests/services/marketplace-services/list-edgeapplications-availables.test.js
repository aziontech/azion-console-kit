import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listEdgeApplicationsAvailablesService } from '@/services/marketplace-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  payload: {
    vendor: 'azion',
    solution: 'jwt'
  },
  availables: {
    id: 1701448066,
    name: 'BYOB',
    upgradeable: false,
    elegible_for_install: false,
    need_to_enable_edge_functions_module: false
  }
}

const makeSut = () => {
  const sut = listEdgeApplicationsAvailablesService
  return { sut }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()
    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `marketplace/rtm_integration/user_edge_applications/${fixtures.payload.vendor}/${fixtures.payload.solution}`,
      method: 'GET'
    })
  })

  it('should parsed correctly each solution record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [fixtures.availables]
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.payload)

    expect(result).toEqual([
      {
        id: fixtures.availables.id,
        name: fixtures.availables.name,
        upgradeable: fixtures.availables.upgradeable,
        elegibleForInstall: fixtures.availables.elegible_for_install,
        needToEnableEdgeFunctionsModule: fixtures.availables.need_to_enable_edge_functions_module
      }
    ])
  })

  it('should parsed correctly empty list returned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.payload)

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
