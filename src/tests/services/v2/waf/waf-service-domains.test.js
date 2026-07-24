import { httpService } from '@/services/v2/base/http/httpService'
import { wafService } from '@/services/v2/waf/waf-service'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/v2/base/http/httpService')

const makeDomains = (start, quantity) =>
  Array.from({ length: quantity }, (item, index) => ({
    id: start + index,
    name: `domain-${start + index}`,
    domain: `domain-${start + index}.map.azionedge.net`,
    extra_field: 'should-be-dropped'
  }))

describe('WafService.listWafDomains', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(wafService, 'useEnsureQueryData').mockImplementation((queryKey, queryFn) => queryFn())
  })

  it('should fetch a single page when the total fits in one page', async () => {
    const domains = makeDomains(1, 2)
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 2, results: domains }
    })

    const result = await wafService.listWafDomains(14209)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenCalledWith({
      url: '/api/v3/waf/14209/domains',
      method: 'GET',
      params: { page: 1, page_size: 100 }
    })
    expect(result).toEqual([
      { id: 1, name: 'domain-1', domain: 'domain-1.map.azionedge.net' },
      { id: 2, name: 'domain-2', domain: 'domain-2.map.azionedge.net' }
    ])
  })

  it('should fetch all pages when the total exceeds the page size', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockImplementation(({ params }) => {
      const pages = {
        1: makeDomains(1, 100),
        2: makeDomains(101, 100),
        3: makeDomains(201, 50)
      }
      return Promise.resolve({ data: { count: 250, results: pages[params.page] } })
    })

    const result = await wafService.listWafDomains(14209)

    expect(requestSpy).toHaveBeenCalledTimes(3)
    expect(requestSpy).toHaveBeenCalledWith({
      url: '/api/v3/waf/14209/domains',
      method: 'GET',
      params: { page: 2, page_size: 100 }
    })
    expect(requestSpy).toHaveBeenCalledWith({
      url: '/api/v3/waf/14209/domains',
      method: 'GET',
      params: { page: 3, page_size: 100 }
    })
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
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 0 }
    })

    const result = await wafService.listWafDomains(14209)

    expect(result).toEqual([])
  })
})
