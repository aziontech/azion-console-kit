import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadWafRulesService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    active: true,
    bypass_addresses: [],
    cross_site_scripting: false,
    cross_site_scripting_sensitivity: 'medium',
    directory_traversal: false,
    directory_traversal_sensitivity: 'medium',
    evading_tricks: false,
    evading_tricks_sensitivity: 'medium',
    file_upload: true,
    file_upload_sensitivity: 'medium',
    id: 4044,
    identified_attack: false,
    identified_attack_sensitivity: 'medium',
    mode: 'counting',
    name: 'test',
    remote_file_inclusion: false,
    remote_file_inclusion_sensitivity: 'medium',
    sql_injection: false,
    sql_injection_sensitivity: 'medium',
    unwanted_access: false,
    unwanted_access_sensitivity: 'medium'
  }
}

const makeSut = () => {
  const sut = loadWafRulesService

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
      body: { results: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()
    await sut({ id: fixtures.wafRulesMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/rulesets/4044',
      method: 'GET'
    })
  })

  it('should parsed correctly the returned waf rules', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.wafRulesMock.id })

    expect(result).toEqual({
      active: fixtures.wafRulesMock.active,
      bypassAddresses: fixtures.wafRulesMock.bypass_addresses,
      crossSiteScriptingSensitivity: fixtures.wafRulesMock.cross_site_scripting_sensitivity,
      directoryTraversalSensitivity: fixtures.wafRulesMock.directory_traversal_sensitivity,
      evadingTricksSensitivity: fixtures.wafRulesMock.evading_tricks_sensitivity,
      fileUploadSensitivity: fixtures.wafRulesMock.file_upload_sensitivity,
      id: fixtures.wafRulesMock.id,
      identifiedAttackSensitivity: fixtures.wafRulesMock.identified_attack_sensitivity,
      mode: fixtures.wafRulesMock.mode,
      name: fixtures.wafRulesMock.name,
      remoteFileInclusionSensitivity: fixtures.wafRulesMock.remote_file_inclusion_sensitivity,
      sqlInjectionSensitivity: fixtures.wafRulesMock.sql_injection_sensitivity,
      unwantedAccessSensitivity: fixtures.wafRulesMock.unwanted_access_sensitivity,
      fileUpload: fixtures.wafRulesMock.file_upload,
      evadingTricks: fixtures.wafRulesMock.evading_tricks,
      unwantedAccess: fixtures.wafRulesMock.unwanted_access,
      identifiedAttack: fixtures.wafRulesMock.identified_attack,
      crossSiteScripting: fixtures.wafRulesMock.cross_site_scripting,
      directoryTraversal: fixtures.wafRulesMock.directory_traversal,
      remoteFileInclusion: fixtures.wafRulesMock.remote_file_inclusion,
      sqlInjection: fixtures.wafRulesMock.sql_injection
    })
  })
})
