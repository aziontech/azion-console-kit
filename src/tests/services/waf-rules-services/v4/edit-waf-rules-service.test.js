import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editWafRulesService } from '@/services/waf-rules-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    crossSiteScriptingSensitivity: 'medium',
    directoryTraversalSensitivity: 'medium',
    evadingTricksSensitivity: 'medium',
    fileUploadSensitivity: 'medium',
    identifiedAttackSensitivity: 'medium',
    remoteFileInclusionSensitivity: 'medium',
    sqlInjectionSensitivity: 'medium',
    unwantedAccessSensitivity: 'medium',
    fileUpload: true,
    evadingTricks: true,
    unwantedAccess: true,
    identifiedAttack: true,
    crossSiteScripting: true,
    directoryTraversal: true,
    remoteFileInclusion: true,
    sqlInjection: true,
    active: false,
    name: 'test'
  }
}

const makeSut = () => {
  const sut = editWafRulesService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()
    await sut(fixtures.wafRulesMock, 4040)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_firewall/wafs/4040',
      method: 'PATCH',
      body: {
        threats_configuration: {
          bypass_addresses: fixtures.wafRulesMock.bypassAddresses,
          cross_site_scripting_sensitivity: fixtures.wafRulesMock.crossSiteScriptingSensitivity,
          directory_traversal_sensitivity: fixtures.wafRulesMock.directoryTraversalSensitivity,
          evading_tricks_sensitivity: fixtures.wafRulesMock.evadingTricksSensitivity,
          file_upload_sensitivity: fixtures.wafRulesMock.fileUploadSensitivity,
          identified_attack_sensitivity: fixtures.wafRulesMock.identifiedAttackSensitivity,
          remote_file_inclusion_sensitivity: fixtures.wafRulesMock.remoteFileInclusionSensitivity,
          sql_injection_sensitivity: fixtures.wafRulesMock.sqlInjectionSensitivity,
          unwanted_access_sensitivity: fixtures.wafRulesMock.unwantedAccessSensitivity,
          file_upload: fixtures.wafRulesMock.fileUpload,
          evading_tricks: fixtures.wafRulesMock.evadingTricks,
          unwanted_access: fixtures.wafRulesMock.unwantedAccess,
          identified_attack: fixtures.wafRulesMock.identifiedAttack,
          cross_site_scripting: fixtures.wafRulesMock.crossSiteScripting,
          directory_traversal: fixtures.wafRulesMock.directoryTraversal,
          remote_file_inclusion: fixtures.wafRulesMock.remoteFileInclusion,
          sql_injection: fixtures.wafRulesMock.sqlInjection,
        },
        id: fixtures.wafRulesMock.id,
        name: fixtures.wafRulesMock.name,
        active: fixtures.wafRulesMock.active
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.wafRulesMock)

    expect(data).toStrictEqual('Your waf rule has been updated')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'detail'
    const apiErrorMock = 'This field is required.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.wafRulesMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('should throw when request fails with status code 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })
    const { sut } = makeSut()

    const expectedError = new Errors.InternalServerError().message

    const response = sut(fixtures.wafRulesMock)

    expect(response).rejects.toBe(expectedError)
  })
})
