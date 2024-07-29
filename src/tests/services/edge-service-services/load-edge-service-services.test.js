import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: 76789,
    name: 'My Edge Service',
    is_active: true,
    modules: {
      port: 123,
      greeting: 'Hello'
    }
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
      body: { data: [] }
    })
    const dnsIdMock = 76789
    const { sut } = makeSut()

    await sut({ id: dnsIdMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/orchestrator/edge_services/${dnsIdMock}?fields=id%2Cname%2Cis_active%2Cmodules`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned edge service', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          id: fixtures.mock.id,
          name: fixtures.mock.name,
          is_active: fixtures.mock.is_active,
          modules: {
            port: 123,
            greeting: 'Hello'
          }
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.mock.id })

    expect(result).toEqual({
      id: fixtures.mock.id,
      name: fixtures.mock.name,
      active: fixtures.mock.is_active,
      code: `port=123\ngreeting=Hello`
    })
  })
})
