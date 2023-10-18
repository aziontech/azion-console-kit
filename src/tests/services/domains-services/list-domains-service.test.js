import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDomainsService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    id: '1234',
    name: 'Edge App X',
    domain_name: 'domain A',
    cnames: ['CName 1', 'CName 2'],
    digital_certificate_id: '862026'
  }
}

const makeSut = () => {
  const sut = listDomainsService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `domains?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.domainMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.domainMock.id,
        name: fixtures.domainMock.name,
        domainName: fixtures.domainMock.domain_name,
        cnames: 'CName 1,CName 2',
        edgeApplicationName: fixtures.domainMock.name,
        digitalCertificateId: fixtures.domainMock.digital_certificate_id
      }
    ])
  })
})
