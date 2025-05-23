import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: 76789,
    active: true,
    variables: [
      {
        name: 'port',
        value: '123'
      }
    ],
    name: 'My Edge Service'
  }
}

const makeSut = () => {
  const sut = loadEdgeServiceServices

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const dnsIdMock = 76789
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: dnsIdMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_services/${dnsIdMock}?with_vars=true`,
      method: 'GET'
    })
  })

  it('should return an error when the request fails with status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request' }
    })

    const { sut } = makeSut()

    await expect(sut({ id: fixtures.mock.id })).rejects.toThrow('Bad Request')
  })

  it('should parsed correctly the returned edge service', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        name: fixtures.mock.name,
        active: fixtures.mock.active,
        variables: [
          {
            name: 'port',
            value: '123'
          }
        ]
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.mock.id })

    expect(result).toEqual({
      name: fixtures.mock.name,
      active: fixtures.mock.active,
      code: 'port=123'
    })
  })
})
