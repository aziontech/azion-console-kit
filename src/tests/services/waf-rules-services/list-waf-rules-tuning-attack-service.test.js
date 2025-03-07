import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesTuningAttacksService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    hit_count: 10,
    top_10_ips: [{ ip: '120.103.10', hits: 10 }],
    rule_id: 1000,
    ip_count: 8,
    match_zone: 'value',
    path_count: 10,
    top_10_countries: [{ country: 'Brazil', hits: 10 }],
    matches_on: 'query_string',
    country_count: 10,
    match_value: 'value',
    top_10_paths: [{ path: '/get', hits: 10 }]
  }
}

const makeSut = () => {
  const sut = listWafRulesTuningAttacksService

  return {
    sut
  }
}

describe('WafRulesService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesMock] }
    })
    const { sut } = makeSut()
    await sut({
      wafId: 4044,
      tuningId: 10011,
      query: {
        domains: '1705587704',
        hourRange: '48',
        network: null,
        countries: null,
        ipsList: null,
        matchesOn: null,
        matchZone: null,
        pathsList: null
      }
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/waf/4044/waf_events/1001?domains_ids=1705587704&hour_range=48`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned waf rules tuning', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesMock] }
    })
    const { sut } = makeSut()

    const result = await sut({
      wafId: 4044,
      tuningId: 10011,
      query: {
        domains: '1705587704',
        hourRange: '48',
        network: null,
        countries: null,
        ipsList: null,
        matchesOn: null,
        matchZone: null,
        pathsList: null
      }
    })

    expect(result).toEqual([
      {
        hitCount: fixtures.wafRulesMock.hit_count,
        topIps: ['120.103.10 (10 hits)'],
        id: 0,
        ruleId: fixtures.wafRulesMock.rule_id,
        ipCount: fixtures.wafRulesMock.ip_count,
        matchZone: fixtures.wafRulesMock.match_zone,
        pathCount: fixtures.wafRulesMock.path_count,
        topCountries: ['Brazil (10 hits)'],
        matchesOn: fixtures.wafRulesMock.matches_on,
        countryCount: fixtures.wafRulesMock.country_count,
        topPaths: ['/get (10 hits)'],
        matchValue: fixtures.wafRulesMock.match_value
      }
    ])
  })
})
