import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeApplicationService } from '@/services/edge-application-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  edgeApplicationMock: {
    id: 'Abcj256789',
    name: 'example',
    deliveryProtocol: 'https',
    http3: true,
    httpPort: [{ name: '80 (Default)', value: '80' }],
    httpsPort: [{ name: '8008', value: '8008' }],
    minimumTlsVersion: '',
    active: true,
    debugRules: ['rule1', 'rule2'],
    supportedCiphers: 'mock_cipher',
    applicationAccelerator: true,
    deviceDetection: true,
    edgeFunctions: true,
    imageOptimization: true,
    l2Caching: true,
    loadBalancer: true,
    websocket: true,
    rawLogs: true,
    webApplicationFirewall: true
  }
}
const makeSut = () => {
  const sut = editEdgeApplicationService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should be able to call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut(fixtures.edgeApplicationMock)

    await sut(fixtures.edgeApplicationMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `v3/edge_applications/${fixtures.edgeApplicationMock.id}`,
      body: {
        name: fixtures.edgeApplicationMock.name,
        delivery_protocol: fixtures.edgeApplicationMock.deliveryProtocol,
        http3: fixtures.edgeApplicationMock.http3,
        http_port: [fixtures.edgeApplicationMock.httpPort[0].value],
        https_port: [fixtures.edgeApplicationMock.httpsPort[0].value],
        minimum_tls_version: '',
        active: fixtures.edgeApplicationMock.active,
        debug_rules: ['rule1', 'rule2'],
        supported_ciphers: fixtures.edgeApplicationMock.supportedCiphers,
        application_acceleration: fixtures.edgeApplicationMock.applicationAccelerator,
        device_detection: fixtures.edgeApplicationMock.deviceDetection,
        edge_firewall: false,
        edge_functions: fixtures.edgeApplicationMock.edgeFunctions,
        image_optimization: fixtures.edgeApplicationMock.imageOptimization,
        l2_caching: fixtures.edgeApplicationMock.l2Caching,
        load_balancer: fixtures.edgeApplicationMock.loadBalancer,
        websocket: fixtures.edgeApplicationMock.websocket,
        raw_logs: fixtures.edgeApplicationMock.rawLogs,
        web_application_firewall: fixtures.edgeApplicationMock.webApplicationFirewall
      }
    })
  })

  it('should keep edge firewall disabled', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut(fixtures.edgeApplicationMock)

    await sut(fixtures.edgeApplicationMock)

    expect(requestSpy.mock.lastCall[0].body).toHaveProperty('edge_firewall', false)
  })

  it('should return first api error message on Not Found api request (404)', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        user_has_no_flag: 'api-error-message'
      }
    })
    const { sut } = makeSut(fixtures.edgeApplicationMock)

    const result = sut(fixtures.edgeApplicationMock)

    expect(result).rejects.toBe('user_has_no_flag: api-error-message')
  })

  it('should show user no product error first ', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        user_has_no_flag: 'api-error',
        user_has_no_product: 'no-product-error-message'
      }
    })
    const { sut } = makeSut(fixtures.edgeApplicationMock)

    const result = sut(fixtures.edgeApplicationMock)

    expect(result).rejects.toBe(`user_has_no_flag: api-error`)
  })

  it('should return first error name on conflict status code (409)', async () => {
    const errorMessageMock = 'api-error-message'
    const errorKeyMock = 'api-error-key'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 409,
      body: {
        [errorKeyMock]: errorMessageMock
      }
    })
    const { sut } = makeSut(fixtures.edgeApplicationMock)

    const result = sut(fixtures.edgeApplicationMock)

    expect(result).rejects.toBe(`${errorKeyMock}: ${errorMessageMock}`)
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

      const response = sut(fixtures.edgeApplicationMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
