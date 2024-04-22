import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { postAdditionalDataService } from '@/services/signup-services'

const additionalDataPayloadMock = {
  payload: {
    id: '1234',
    use: 'Option 1',
    role: 'Option 4',
    inputRole: 'Test role',
    companySize: 'Option 6',
    companyWebsite: 'https://www.azion.com',
    onboardingSession: true
  },
  options: [
    {
      key: 'Question 1 - Use',
      values: [
        {
          id: '1',
          value: 'Option 1',
          other_values: false
        },
        {
          id: '2',
          value: 'Option 2',
          other_values: false
        }
      ]
    },
    {
      key: 'Question 2 - Role',
      values: [
        {
          id: '3',
          value: 'Option 3',
          other_values: false
        },
        {
          id: '4',
          value: 'Option 4',
          other_values: true
        }
      ]
    },
    {
      key: 'Question 3 - Company Size',
      values: [
        {
          id: '5',
          value: 'Option 5',
          other_values: false
        },
        {
          id: '6',
          value: 'Option 6',
          other_values: false
        }
      ]
    },
    {
      key: 'Question 4 - Name'
    },
    {
      key: 'Question 5 - Company Website',
      values: [{ id: '21', value: '', other_values: true }]
    },
    {
      key: 'Question 6 - Onboarding Session',
      values: [
        {
          id: '11',
          value: 'Yes'
        },
        {
          id: '12',
          value: 'No'
        }
      ]
    }
  ],
  formatted: [
    {
      value: '1'
    },
    {
      value: '4',
      other_values: 'Test role'
    },
    {
      value: '6'
    },
    {
      value: '21',
      other_values: 'https://www.azion.com'
    },
    {
      value: '11'
    }
  ]
}

const makeSut = () => {
  const sut = postAdditionalDataService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const version = 'v4'

    await sut({
      payload: additionalDataPayloadMock.payload,
      options: additionalDataPayloadMock.options
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users/${additionalDataPayloadMock.payload.id}/additional_data`,
      method: 'POST',
      body: additionalDataPayloadMock.formatted
    })
  })

  it('should not return a feedback message on successfully sent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const req = await sut({
      payload: additionalDataPayloadMock.payload,
      options: additionalDataPayloadMock.options
    })

    expect(req).toBeNull()
  })

  it('should return a feedback message when request fails with status 400', async () => {
    const expectedError = new Error(
      JSON.stringify({
        errorMessage: 'User already has additional data',
        errorType: 'field',
        fieldName: 'use'
      })
    )

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: [
        {
          detail: [
            {
              message:
                "User already has an additional data key: 'How are you planning to use Azion?' for the provided value id: 1."
            }
          ]
        }
      ]
    })
    const { sut } = makeSut()

    const request = sut({
      payload: additionalDataPayloadMock.payload,
      options: additionalDataPayloadMock.options
    })

    expect(request).rejects.toBe(expectedError.message)
  })

  it.each([
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

      const request = sut({
        payload: additionalDataPayloadMock.payload,
        options: additionalDataPayloadMock.options
      })

      expect(request).rejects.toBe(expectedError.message)
    }
  )
})
