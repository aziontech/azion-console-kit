import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createWafRulesService } from '@/services/waf-rules-services'
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
  const sut = createWafRulesService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()
    await sut(fixtures.wafRulesMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/waf/rulesets',
      method: 'POST',
      body: {
        bypass_addresses: fixtures.wafRulesMock.bypassAddresses,
        cross_site_scripting_sensitivity: fixtures.wafRulesMock.crossSiteScriptingSensitivity,
        directory_traversal_sensitivity: fixtures.wafRulesMock.directoryTraversalSensitivity,
        evading_tricks_sensitivity: fixtures.wafRulesMock.evadingTricksSensitivity,
        file_upload_sensitivity: fixtures.wafRulesMock.fileUploadSensitivity,
        id: fixtures.wafRulesMock.id,
        identified_attack_sensitivity: fixtures.wafRulesMock.identifiedAttackSensitivity,
        name: fixtures.wafRulesMock.name,
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
        active: fixtures.wafRulesMock.active
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: fixtures.wafRulesMock
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.wafRulesMock)

    expect(data).toStrictEqual({
      feedback: 'Your waf rule has been created',
      urlToEditView: '/waf'
    })
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

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.wafRulesMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
