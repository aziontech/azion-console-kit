import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesDomainsService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesDomainMock: {
    cnames: [],
    domain: 'erwc1eveo1.map.azionedge.net',
    id: 1705587704,
    name: 'atack'
  }
}

const makeSut = () => {
  const sut = listWafRulesDomainsService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { result: null }
    })

    const { sut } = makeSut()
    await sut({ wafId: 100 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/100/domains?page_size=200',
      method: 'GET'
    })
  })

  it('should parsed correctly domain', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesDomainMock] }
    })
    const { sut } = makeSut()

    const result = await sut({ wafId: 100 })

    expect(result).toEqual([
      {
        domain: fixtures.wafRulesDomainMock.domain,
        id: fixtures.wafRulesDomainMock.id,
        name: fixtures.wafRulesDomainMock.name
      }
    ])
  })
})
