import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesDomainsService } from '@/services/waf-rules-services'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeDomains = (start, quantity) =>
  Array.from({ length: quantity }, (item, index) => ({
    id: start + index,
    name: `domain-${start + index}`,
    domain: `domain-${start + index}.map.azionedge.net`,
    cnames: []
  }))

const makeSut = () => {
  const sut = listWafRulesDomainsService

  return {
    sut
  }
}

describe('WafRulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { count: 1, results: makeDomains(1, 1) }
    })
    const { sut } = makeSut()

    await sut({ wafId: 4044 })

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/4044/domains?page=1&page_size=100',
      method: 'GET'
    })
  })

  it('should parse correctly each domain', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { count: 1, results: makeDomains(1, 1) }
    })
    const { sut } = makeSut()

    const result = await sut({ wafId: 4044 })

    expect(result).toEqual([{ id: 1, name: 'domain-1', domain: 'domain-1.map.azionedge.net' }])
  })

  it('should fetch all pages when the total exceeds the page size', async () => {
    const pages = {
      'v3/waf/4044/domains?page=1&page_size=100': makeDomains(1, 100),
      'v3/waf/4044/domains?page=2&page_size=100': makeDomains(101, 100),
      'v3/waf/4044/domains?page=3&page_size=100': makeDomains(201, 50)
    }
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockImplementation(({ url }) =>
        Promise.resolve({ statusCode: 200, body: { count: 250, results: pages[url] } })
      )
    const { sut } = makeSut()

    const result = await sut({ wafId: 4044 })

    expect(requestSpy).toHaveBeenCalledTimes(3)
    expect(result).toHaveLength(250)
    expect(result[0]).toEqual({
      id: 1,
      name: 'domain-1',
      domain: 'domain-1.map.azionedge.net'
    })
    expect(result[249]).toEqual({
      id: 250,
      name: 'domain-250',
      domain: 'domain-250.map.azionedge.net'
    })
  })

  it('should return an empty list when the API does not return results', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })
    const { sut } = makeSut()

    const result = await sut({ wafId: 4044 })

    expect(result).toEqual([])
  })
})
