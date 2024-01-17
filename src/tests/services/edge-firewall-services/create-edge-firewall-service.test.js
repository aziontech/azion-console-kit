import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeFirewallService } from '@/services/edge-firewall-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallMock: {
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
  const sut = createEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { results: { id: '123' } }
    })

    const { sut } = makeSut()

    await sut(fixtures.edgeFirewallMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v3/edge_firewall',
      body: {
        name: fixtures.edgeFirewallMock.name,
        is_active: fixtures.edgeFirewallMock.isActive,
        debug_rules: fixtures.edgeFirewallMock.debugRules,
        edge_functions_enabled: fixtures.edgeFirewallMock.edgeFunctionsEnabled,
        network_protection_enabled: fixtures.edgeFirewallMock.networkProtectionEnabled,
        waf_enabled: fixtures.edgeFirewallMock.wafEnabled,
        domains: [1, 2]
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { results: { id: '123' } }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.edgeFirewallMock)

    expect(feedback).toBe('Your Edge Firewall has been created')
  })

  it.each([
    {
      error: 'duplicated_edge_firewall_name',
      key: 'results',
      expectedError: 'Edge Firewall cannot be created because it already exists'
    },
    {
      error: 'no_modules_enabled',
      key: 'results',
      expectedError: 'Edge Firewall cannot be created because no modules are enabled'
    },
    {
      error: 'unmappedError',
      key: 'results',
      expectedError: new Errors.UnexpectedError().message
    },
    {
      error: 'name is required',
      key: 'name',
      expectedError: 'name is required'
    }
  ])(
    'should throw an error if the API returns a $error in status code 400',
    async ({ error, key, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: 400,
        body: { [key]: [error] }
      })
      const { sut } = makeSut()

      const feedbackMessage = sut(fixtures.edgeFirewallMock)

      expect(feedbackMessage).rejects.toThrow(expectedError)
    }
  )

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
      statusCode: 422,
      expectedError: new Errors.InvalidApiRequestError().message
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

      const response = sut(fixtures.edgeFirewallMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
