import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { cloneWafRulesService } from '@/services/waf-rules-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  wafRulesMock: {
    id: 4099,
    active: {
      content: 'Active'
    },
    threatsConfigurationWithoutFormat: {
      cross_site_scripting: true,
      cross_site_scripting_sensitivity: 'medium',
      directory_traversal: true,
      directory_traversal_sensitivity: 'medium',
      evading_tricks: true,
      evading_tricks_sensitivity: 'medium',
      file_upload: true,
      file_upload_sensitivity: 'medium',
      identified_attack: true,
      identified_attack_sensitivity: 'medium',
      remote_file_inclusion: true,
      remote_file_inclusion_sensitivity: 'medium',
      sql_injection: true,
      sql_injection_sensitivity: 'medium',
      unwanted_access: true,
      unwanted_access_sensitivity: 'medium'
    }
  },
  wafRulesName: 'Cloned'
}

const makeSut = () => {
  const sut = cloneWafRulesService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()
    await sut({ payload: fixtures.wafRulesMock, wafRulesName: fixtures.wafRulesName })

    const version = 'v4'

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_firewall/wafs/${fixtures.wafRulesMock.id}/clone`,
      method: 'POST',
      body: {
        name: fixtures.wafRulesName,
        active: true,
        threats_configuration: fixtures.wafRulesMock.threatsConfigurationWithoutFormat,
        id: fixtures.wafRulesMock.id
      }
    })
  })

  it('should return a feedback message on successfully cloned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: fixtures.wafRulesMock }
    })
    const { sut } = makeSut()

    const data = await sut({ payload: fixtures.wafRulesMock, wafRulesName: fixtures.wafRulesName })

    expect(data).toStrictEqual({
      feedback: 'Your waf rule has been cloned',
      urlToEditView: `/waf/edit/${fixtures.wafRulesMock.id}`
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

    const feedbackMessage = sut({
      payload: fixtures.wafRulesMock,
      wafRulesName: fixtures.wafRulesName
    })

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

      const response = sut({ payload: fixtures.wafRulesMock, wafRulesName: fixtures.wafRulesName })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
