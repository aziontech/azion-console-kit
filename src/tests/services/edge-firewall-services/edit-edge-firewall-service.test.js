import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeFirewallService } from '@/services/edge-firewall-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: '123',
    name: 'test',
    domains: [{ id: 1 }, { id: 2 }],
    isActive: true,
    debugRules: false,
    edgeFunctionsEnabled: false,
    networkProtectionEnabled: false,
    wafEnabled: false
  }
}

const makeSut = () => {
  const sut = editEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_firewall/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.mock.name,
        is_active: fixtures.mock.isActive,
        debug_rules: fixtures.mock.debugRules,
        edge_functions_enabled: fixtures.mock.edgeFunctionsEnabled,
        network_protection_enabled: fixtures.mock.networkProtectionEnabled,
        waf_enabled: fixtures.mock.wafEnabled,
        domains: [1, 2]
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your edge firewall has been updated')
  })

  it('Should return an API error to an invalid edge service name', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.mock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.mock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
