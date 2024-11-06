import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeFirewallService } from '@/services/edge-firewall-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: '123',
    name: 'test',
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
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_firewall/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.mock.name,
        is_active: fixtures.mock.isActive,
        debug_rules: fixtures.mock.debugRules,
        edge_functions_enabled: fixtures.mock.edgeFunctionsEnabled,
        network_protection_enabled: fixtures.mock.networkProtectionEnabled,
        waf_enabled: fixtures.mock.wafEnabled
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

  it.each([
    {
      error: 'duplicated_edge_firewall_name',
      key: 'results',
      expectedError: 'Edge Firewall cannot be edited because it already exists'
    },
    {
      error: 'no_modules_enabled',
      key: 'results',
      expectedError: 'Edge Firewall cannot be edited because no modules are enabled'
    },
    {
      error: 'domains_already_in_use',
      key: 'results',
      expectedError: 'Edge Firewall cannot be edited because the domains are already in use'
    },
    {
      error: 'has_functions_instances',
      key: 'results',
      expectedError:
        'Cannot disable Edge Functions because Edge Firewall is using at least one function.'
    },
    {
      error: 'solution_in_use',
      key: 'results',
      expectedError:
        'It was not possible to perform this operation. To disable "Web Application Firewall", you must first remove all settings on this RuleSet that require it.'
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
      const feedbackMessage = sut(fixtures.mock)

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
