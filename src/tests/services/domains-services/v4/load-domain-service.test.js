import { describe, expect, it, vi } from 'vitest'
import { loadDomainService } from '@/services/domains-services/v4'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  domainMock: {
    id: 0,
    name: 'string',
    alternate_domains: [],
    active: true,
    network_map: '1',
    last_editor: 'string',
    last_modified: '2019-08-24T14:15:22Z',
    tls: {
      certificate: 1,
      ciphers: 'TLSv1.2_2018',
      minimum_version: 'tls_1_0'
    },
    protocols: {
      http: {
        versions: ['http1', 'http2'],
        http_ports: [80],
        https_ports: [443],
        quic_ports: [0]
      }
    },
    mtls: {
      verification: 'enforce',
      certificate: 1,
      crl: [1]
    },
    domains: [
      {
        domain: 'string',
        allow_access: true
      }
    ],
    product_version: 'string'
  }
}

const makeSut = () => {
  const sut = loadDomainService
  return {
    sut
  }
}

describe('DomainServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.domainMock
      }
    })
    const { sut } = makeSut()

    await sut({
      id: fixtures.domainMock.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/workloads/${fixtures.domainMock.id}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned a domain', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.domainMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      id: fixtures.domainMock.id
    })

    expect(result).toEqual({
      id: fixtures.domainMock.id,
      name: fixtures.domainMock.name,
      alternateDomains: fixtures.domainMock.alternate_domains,
      networkMap: fixtures.domainMock.network_map,
      lastEditor: fixtures.domainMock.last_editor,
      lastModified: fixtures.domainMock.last_modified,
      active: fixtures.domainMock.active,
      tls: fixtures.domainMock.tls,
      protocols: fixtures.domainMock.protocols,
      mtls: fixtures.domainMock.mtls,
      domains: fixtures.domainMock.domains,
      productVersion: fixtures.domainMock.product_version
    })
  })
})
