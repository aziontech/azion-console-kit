import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesTuningAttacksService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    hit_count: 10,
    top_10_ips: [{ ip: '120.103.10' }],
    rule_id: 1000,
    ip_count: 8,
    match_zone: 'value',
    path_count: 10,
    top_10_countries: [{ country: 'Brazil' }],
    matches_on: 'query_string',
    country_count: 10,
    match_value: 'value',
    top_10_paths: [{ path: '/get' }]
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
    await sut({ wafId: 4044, query: '?hour_range=48&domains_ids=1705587704', tuningId: 10011 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/4044/waf_events/1001?hour_range=48&domains_ids=1705587704',
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
      query: '?hour_range=48&domains_ids=1705587704',
      tuningId: 10011
    })

    expect(result).toEqual([
      {
        hitCount: fixtures.wafRulesMock.hit_count,
        topIps: ['120.103.10'],
        id: 0,
        ruleId: fixtures.wafRulesMock.rule_id,
        ipCount: fixtures.wafRulesMock.ip_count,
        matchZone: fixtures.wafRulesMock.match_zone,
        pathCount: fixtures.wafRulesMock.path_count,
        topCountries: ['Brazil'],
        matchesOn: fixtures.wafRulesMock.matches_on,
        ruleDescription: fixtures.wafRulesMock.rule_description,
        countryCount: fixtures.wafRulesMock.country_count,
        topPaths: ['/get'],
        matchValue: fixtures.wafRulesMock.match_value
      }
    ])
  })
})
