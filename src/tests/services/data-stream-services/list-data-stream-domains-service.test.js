import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDataStreamDomainsService } from '@/services/data-stream-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainsMock: {
    domain_id: 1239875,
    name: 'JS Edge Node',
    selected: false
  }
}

const makeSut = () => {
  const sut = listDataStreamDomainsService

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/data_streaming/domains?page_size=2000`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.domainsMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.domainsMock.domain_id,
        domainID: fixtures.domainsMock.domain_id,
        name: fixtures.domainsMock.name,
        selected: fixtures.domainsMock.selected
      }
    ])
  })
})
