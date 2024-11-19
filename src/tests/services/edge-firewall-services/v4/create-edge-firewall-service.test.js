import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeFirewallService } from '@/services/edge-firewall-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallMock: {
    name: 'test',
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
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    sut(fixtures.edgeFirewallMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/edge_firewall/firewalls',
      body: {
        name: fixtures.edgeFirewallMock.name,
        active: fixtures.edgeFirewallMock.isActive,
        debug_rules: fixtures.edgeFirewallMock.debugRules,
        modules: {
          ddos_protection_enabled: true,
          edge_functions_enabled: fixtures.edgeFirewallMock.edgeFunctionsEnabled,
          network_protection_enabled: fixtures.edgeFirewallMock.networkProtectionEnabled,
          waf_enabled: fixtures.edgeFirewallMock.wafEnabled
        }
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.edgeFirewallMock)

    expect(feedback).toBe('Your Edge Firewall has been created')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.edgeFirewallMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.edgeFirewallMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
