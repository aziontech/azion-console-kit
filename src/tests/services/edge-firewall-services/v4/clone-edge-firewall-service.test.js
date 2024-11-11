import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { cloneEdgeFirewallService } from '@/services/edge-firewall-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallMock: {
    id: 10
  },
  edgeFirewallName: 'Cloned'
}
const makeSut = () => {
  const sut = cloneEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: { id: fixtures.edgeFirewallMock.id } }
    })

    const { sut } = makeSut()

    await sut({ edgeFirewallName: fixtures.edgeFirewallName, payload: fixtures.edgeFirewallMock })
    const version = 'v4'
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/edge_firewall/firewalls/${fixtures.edgeFirewallMock.id}/clone`,
      body: {
        id: fixtures.edgeFirewallMock.id,
        name: fixtures.edgeFirewallName
      }
    })
  })

  it('should return a feedback message on successfully cloned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: { id: fixtures.edgeFirewallMock.id } }
    })

    const { sut } = makeSut()

    const { feedback } = await sut({
      edgeFirewallName: fixtures.edgeFirewallName,
      payload: fixtures.edgeFirewallMock
    })

    expect(feedback).toBe('Your Edge Firewall has been cloned')
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
      error: 'domains_already_in_use',
      key: 'results',
      expectedError: 'Edge Firewall cannot be created because the domains are already in use'
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

      const feedbackMessage = sut({
        edgeFirewallName: fixtures.edgeFirewallName,
        payload: fixtures.edgeFirewallMock
      })

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

      const response = sut({
        edgeFirewallName: fixtures.edgeFirewallName,
        payload: fixtures.edgeFirewallMock
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
