import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { updateAccountInfoService } from '@/services/signup-services/update-account-info-service'

const fixtures = {
  basePayloadMock: 'Software Developer',
  formattedPayload: {
    job_function: 'software-developer',
    first_login: false
  }
}

const scenarios = [
  {
    jobRole: 'Software Developer',
    formattedJobRole: 'software-developer'
  },
  {
    jobRole: 'DevOps Engineer',
    formattedJobRole: 'devops-engineer'
  },
  {
    jobRole: 'Infrastructure Analyst',
    formattedJobRole: 'infrastructure-analyst'
  },
  {
    jobRole: 'Network Engineer',
    formattedJobRole: 'network-engineer'
  },
  {
    jobRole: 'Security Specialist',
    formattedJobRole: 'security-specialist'
  },
  {
    jobRole: 'Data Engineer',
    formattedJobRole: 'data-engineer'
  },
  {
    jobRole: 'AI/ML Engineer',
    formattedJobRole: 'ai-ml-engineer'
  },
  {
    jobRole: 'IoT Engineer',
    formattedJobRole: 'iot-engineer'
  },
  {
    jobRole: 'Team Lead',
    formattedJobRole: 'team-lead'
  },
  {
    jobRole: 'Other',
    formattedJobRole: 'other'
  }
]

const makeSut = () => {
  const sut = updateAccountInfoService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const version = 'v4'

    const { sut } = makeSut()

    await sut(fixtures.basePayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/accounts`,
      method: 'PATCH',
      body: fixtures.formattedPayload
    })
  })

  it.each(scenarios)(
    'should parse the job role for $jobRole',
    async ({ jobRole, formattedJobRole }) => {
      const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: {}
      })

      const version = 'v4'

      const { sut } = makeSut()

      await sut(jobRole)

      expect(requestSpy).toHaveBeenCalledWith({
        url: `${version}/iam/accounts`,
        method: 'PATCH',
        body: { job_function: formattedJobRole, first_login: false }
      })
    }
  )

  it('should return null on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.basePayloadMock)

    expect(result).toBeNull()
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.InvalidApiRequestError().message,
          errorType: 'field',
          fieldName: 'role'
        })
      )
    },
    {
      statusCode: 403,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.PermissionError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 404,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.NotFoundError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 500,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.InternalServerError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.UnexpectedError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const request = sut(fixtures.basePayloadMock)

      expect(request).rejects.toBe(expectedError.message)
    }
  )
})
