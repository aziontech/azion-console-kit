import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadWafRulesAllowedService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    match_zones: [{ matches_on: null, zone: 'path', zone_input: null }],
    path: '/tmp',
    rule_id: 0,
    description: 'test',
    status: false,
    use_regex: false
  }
}

const makeSut = () => {
  const sut = loadWafRulesAllowedService

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
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()
    await sut({ id: 4044, allowedId: { id: 10 } })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/4044/exceptions/10',
      method: 'GET'
    })
  })

  it('should parsed correctly the returned waf rules allowed', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: 4044, allowedId: { id: 10 } })

    expect(result).toEqual({
      matchZones: fixtures.wafRulesMock.match_zones,
      path: fixtures.wafRulesMock.path,
      reason: fixtures.wafRulesMock.description,
      ruleId: fixtures.wafRulesMock.rule_id,
      status: fixtures.wafRulesMock.status,
      useRegex: fixtures.wafRulesMock.use_regex
    })
  })
})
