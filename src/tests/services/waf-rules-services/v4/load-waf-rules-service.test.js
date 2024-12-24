import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadWafRulesService } from '@/services/waf-rules-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    id: 4044,
    name: 'test',
    active: true,
    threats_configuration: {
      bypass_addresses: [],
      cross_site_scripting: false,
      cross_site_scripting_sensitivity: 'medium',
      directory_traversal: false,
      directory_traversal_sensitivity: 'medium',
      evading_tricks: false,
      evading_tricks_sensitivity: 'medium',
      file_upload: true,
      file_upload_sensitivity: 'medium',
      identified_attack: false,
      identified_attack_sensitivity: 'medium',
      mode: 'counting',
      remote_file_inclusion: false,
      remote_file_inclusion_sensitivity: 'medium',
      sql_injection: false,
      sql_injection_sensitivity: 'medium',
      unwanted_access: false,
      unwanted_access_sensitivity: 'medium'
    }
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
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()
    await sut({ id: fixtures.wafRulesMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/4044',
      method: 'GET'
    })
  })

  it('should parsed correctly the returned waf rules', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.wafRulesMock.id })

    expect(result).toEqual({
      id: fixtures.wafRulesMock.id,
      name: fixtures.wafRulesMock.name,
      active: fixtures.wafRulesMock.active,

      bypassAddresses: fixtures.wafRulesMock.threats_configuration.bypass_addresses,
      crossSiteScriptingSensitivity:
        fixtures.wafRulesMock.threats_configuration.cross_site_scripting_sensitivity,
      directoryTraversalSensitivity:
        fixtures.wafRulesMock.threats_configuration.directory_traversal_sensitivity,
      evadingTricksSensitivity:
        fixtures.wafRulesMock.threats_configuration.evading_tricks_sensitivity,
      fileUploadSensitivity: fixtures.wafRulesMock.threats_configuration.file_upload_sensitivity,
      identifiedAttackSensitivity:
        fixtures.wafRulesMock.threats_configuration.identified_attack_sensitivity,
      mode: fixtures.wafRulesMock.threats_configuration.mode,
      remoteFileInclusionSensitivity:
        fixtures.wafRulesMock.threats_configuration.remote_file_inclusion_sensitivity,
      sqlInjectionSensitivity:
        fixtures.wafRulesMock.threats_configuration.sql_injection_sensitivity,
      unwantedAccessSensitivity:
        fixtures.wafRulesMock.threats_configuration.unwanted_access_sensitivity,
      fileUpload: fixtures.wafRulesMock.threats_configuration.file_upload,
      evadingTricks: fixtures.wafRulesMock.threats_configuration.evading_tricks,
      unwantedAccess: fixtures.wafRulesMock.threats_configuration.unwanted_access,
      identifiedAttack: fixtures.wafRulesMock.threats_configuration.identified_attack,
      crossSiteScripting: fixtures.wafRulesMock.threats_configuration.cross_site_scripting,
      directoryTraversal: fixtures.wafRulesMock.threats_configuration.directory_traversal,
      remoteFileInclusion: fixtures.wafRulesMock.threats_configuration.remote_file_inclusion,
      sqlInjection: fixtures.wafRulesMock.threats_configuration.sql_injection
    })
  })

  it('should handle and throw an error when the API call fails', async () => {
    const error = new Error('Network error')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(error)
    const { sut } = makeSut()

    await expect(sut({ id: fixtures.wafRulesMock.id })).rejects.toThrow('Network error')
  })
})
