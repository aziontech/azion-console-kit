import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesAllowedService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  wafRulesMock: {
    id: 1464,
    last_editor: 'paulo.ferreira+teste1@azion.com',
    last_modified: '2024-01-12T14:24:52.957488Z',
    match_zones: [{ zone: 'file_name', zone_input: null, matches_on: null }],
    path: '/test/te',
    description: 'hello, it is just a test',
    rule_id: 0,
    active: true,
    use_regex: false
  },
  wafRulesMockWithFalseStatus: {
    id: 1464,
    last_editor: 'paulo.ferreira+teste1@azion.com',
    last_modified: '2024-01-12T14:24:52.957488Z',
    match_zones: [{ zone: 'file_name', zone_input: null, matches_on: null }],
    path: '/test/te',
    description: 'hello, it is just a test',
    rule_id: 0,
    active: false,
    use_regex: false
  }
}

const makeSut = () => {
  const sut = listWafRulesAllowedService

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
    await sut({ wafId: 4040 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge/wafs/4040/allowed_rules?page=1&page_size=200',
      method: 'GET'
    })
  })

  it('should parsed correctly each waf rules allowed', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesMock, fixtures.wafRulesMockWithFalseStatus] }
    })
    const { sut } = makeSut()

    const result = await sut({ wafId: 4040 })

    expect(result).toEqual([
      {
        id: 1464,
        lastEditor: fixtures.wafRulesMock.last_editor,
        lastModified: 'Friday, January 12, 2024',
        matchZones: ['File Name (Multipart Body)'],
        path: fixtures.wafRulesMock.path,
        description: fixtures.wafRulesMock.description,
        ruleId: '0 - All Rules',
        status: {
          content: 'Active',
          severity: 'success'
        },
        useRegex: fixtures.wafRulesMock.use_regex
      },
      {
        id: 1464,
        lastEditor: fixtures.wafRulesMock.last_editor,
        lastModified: 'Friday, January 12, 2024',
        matchZones: ['File Name (Multipart Body)'],
        path: fixtures.wafRulesMock.path,
        description: fixtures.wafRulesMock.description,
        ruleId: '0 - All Rules',
        status: {
          content: 'Inactive',
          severity: 'danger'
        },
        useRegex: fixtures.wafRulesMock.use_regex
      }
    ])
  })
})
