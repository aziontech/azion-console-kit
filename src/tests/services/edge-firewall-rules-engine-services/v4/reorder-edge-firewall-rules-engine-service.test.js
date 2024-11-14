import { reorderEdgeFirewallRulesEngine } from '@/services/edge-firewall-rules-engine-services/v4/reorder-edge-firewall-rules-engine-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallId: '123',
  allEdgeFirewallMock: [
    { id: 52777 },
    { id: 52959 },
    { id: 52962 },
    { id: 52957 },
    { id: 52960 },
    { id: 52955 },
    { id: 52963 },
    { id: 40301 },
    { id: 52958 },
    { id: 52956 },
    { id: 52961 }
  ],
  orderedEdgeFirewallMock: [
    { id: 52959 },
    { id: 52962 },
    { id: 52777 },
    { id: 52957 },
    { id: 52960 },
    { id: 52955 },
    { id: 52963 },
    { id: 40301 },
    { id: 52958 },
    { id: 52956 }
  ],
  currentEdgeFirewallMock: [
    { id: 52777 },
    { id: 52959 },
    { id: 52962 },
    { id: 52957 },
    { id: 52960 },
    { id: 52955 },
    { id: 52963 },
    { id: 40301 },
    { id: 52958 },
    { id: 52956 }
  ]
}

const makeSut = () => {
  const sut = reorderEdgeFirewallRulesEngine

  return {
    sut
  }
}

describe('reorderEdgeFirewallRulesEngine', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.allEdgeFirewallMock }
      })
      .mockResolvedValueOnce({
        statusCode: 202
      })

    const { sut } = makeSut()

    const search = ''
    const ordering = ''

    await sut(
      fixtures.orderedEdgeFirewallMock,
      fixtures.currentEdgeFirewallMock,
      fixtures.edgeFirewallId,
      ordering,
      search
    )

    const version = 'v4'

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_firewall/firewalls/${fixtures.edgeFirewallId}/rules/order`,
      method: 'PUT',
      body: { order: [52959, 52962, 52777, 52957, 52960, 52955, 52963, 40301, 52958, 52956, 52961] }
    })
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'order'
    const apiErrorMock =
      'Missing rules in order list, when ordering you should provide the order for all.'
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.allEdgeFirewallMock }
      })
      .mockResolvedValueOnce({
        statusCode: 400,
        body: {
          [errorKey]: [apiErrorMock]
        }
      })

    const search = ''
    const ordering = ''

    const { sut } = makeSut()

    const feedbackMessage = sut(
      fixtures.orderedEdgeFirewallMock,
      fixtures.currentEdgeFirewallMock,
      fixtures.edgeFirewallId,
      ordering,
      search
    )

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
      vi.spyOn(AxiosHttpClientAdapter, 'request')
        .mockResolvedValueOnce({
          statusCode: 200,
          body: { results: fixtures.allEdgeFirewallMock }
        })
        .mockResolvedValueOnce({
          statusCode
        })

      const { sut } = makeSut()

      const search = ''
      const ordering = ''

      const response = sut(
        fixtures.orderedEdgeFirewallMock,
        fixtures.currentEdgeFirewallMock,
        fixtures.edgeFirewallId,
        ordering,
        search
      )

      expect(response).rejects.toBe(expectedError)
    }
  )
})
