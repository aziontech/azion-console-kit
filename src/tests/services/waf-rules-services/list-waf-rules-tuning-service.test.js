import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesTuningService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    hit_count: 10,
    top_10_ips: [['', '100.100.10']],
    rule_id: 1000,
    ip_count: 8,
    match_zone: 'value',
    path_count: 10,
    top_10_countries: [['', 'Brazil']],
    matches_on: 'query_string',
    rule_description: 'Possible SQL Injection attack: SQL keywords found in Query String',
    country_count: 10
  },
  payload: {
    wafId: 44,
    domains: 1705587704,
    network: 123,
    hourRange: 48
  }
}

const makeSut = () => {
  const sut = listWafRulesTuningService

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
    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/44/waf_events?domains_ids=1705587704&network_list_id=123&hour_range=48',
      method: 'GET'
    })
  })

  it('should parsed correctly the returned waf rules tuning', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesMock] }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.payload)

    expect(result).toEqual({
      data: [
        {
          hitCount: fixtures.wafRulesMock.hit_count,
          topIps: fixtures?.wafRulesMock?.top_10_ips?.[0]?.[1] || '',
          ruleId: fixtures.wafRulesMock.rule_id,
          id: `${fixtures.wafRulesMock.rule_id}0`,
          ruleIdDescription: `${fixtures.wafRulesMock.rule_id} - ${fixtures.wafRulesMock.rule_description}`,
          ipCount: fixtures.wafRulesMock.ip_count,
          matchZone: fixtures.wafRulesMock.match_zone,
          pathCount: fixtures.wafRulesMock.path_count,
          topCountries: fixtures?.wafRulesMock?.top_10_countries?.[0]?.[1] || '',
          matchesOn: fixtures.wafRulesMock.matches_on,
          ruleDescription: fixtures.wafRulesMock.rule_description,
          countryCount: fixtures.wafRulesMock.country_count
        }
      ],
      recordsFound: 1
    })
  })
  it('should return empty data when the values in the parameter are not passed in ', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      data: [],
      recordsFound: 0
    })
  })

  it('Should return an API error for an 400 response status', async () => {
    const apiErrorMock = 'Error message'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [
          {
            message: 'Error message'
          }
        ]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.payload)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })
})
