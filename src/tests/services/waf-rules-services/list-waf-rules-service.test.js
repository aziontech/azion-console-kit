import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWafRulesService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

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
  },
  wafRulesMockWithFalseActive: {
    active: false,
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
  const sut = listWafRulesService

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
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/?page=1&page_size=2000',
      method: 'GET'
    })
  })

  it('should parsed correctly each waf rules', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.wafRulesMock, fixtures.wafRulesMockWithFalseActive] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.wafRulesMock.id,
        active: {
          content: 'Active',
          severity: 'success'
        },
        bypassAddresses: fixtures.wafRulesMock.bypass_addresses,
        crossSiteScriptingSensitivity: fixtures.wafRulesMock.cross_site_scripting_sensitivity,
        directoryTraversalSensitivity: fixtures.wafRulesMock.directory_traversal_sensitivity,
        evadingTricksSensitivity: fixtures.wafRulesMock.evading_tricks_sensitivity,
        fileUploadSensitivity: fixtures.wafRulesMock.file_upload_sensitivity,
        identifiedAttackSensitivity: fixtures.wafRulesMock.identified_attack_sensitivity,
        mode: fixtures.wafRulesMock.mode,
        name: fixtures.wafRulesMock.name,
        remoteFileInclusionSensitivity: fixtures.wafRulesMock.remote_file_inclusion_sensitivity,
        sqlInjectionSensitivity: fixtures.wafRulesMock.sql_injection_sensitivity,
        unwantedAccessSensitivity: fixtures.wafRulesMock.unwanted_access_sensitivity,
        threatTypes: ['File upload']
      },
      {
        id: fixtures.wafRulesMock.id,
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        bypassAddresses: fixtures.wafRulesMock.bypass_addresses,
        crossSiteScriptingSensitivity: fixtures.wafRulesMock.cross_site_scripting_sensitivity,
        directoryTraversalSensitivity: fixtures.wafRulesMock.directory_traversal_sensitivity,
        evadingTricksSensitivity: fixtures.wafRulesMock.evading_tricks_sensitivity,
        fileUploadSensitivity: fixtures.wafRulesMock.file_upload_sensitivity,
        identifiedAttackSensitivity: fixtures.wafRulesMock.identified_attack_sensitivity,
        mode: fixtures.wafRulesMock.mode,
        name: fixtures.wafRulesMock.name,
        remoteFileInclusionSensitivity: fixtures.wafRulesMock.remote_file_inclusion_sensitivity,
        sqlInjectionSensitivity: fixtures.wafRulesMock.sql_injection_sensitivity,
        unwantedAccessSensitivity: fixtures.wafRulesMock.unwanted_access_sensitivity,
        threatTypes: ['File upload']
      }
    ])
  })
})
