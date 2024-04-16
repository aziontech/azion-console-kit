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
      values: []
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
      id: '1',
      value: 'Option 1',
      other_values: null
    },
    {
      id: '4',
      value: 'Option 4',
      other_values: 'Test role'
    },
    {
      id: '6',
      value: 'Option 6',
      other_values: null
    },
    {
      value: 'https://www.azion.com',
      other_values: null
    },
    {
      id: '11',
      value: 'Yes',
      other_values: null
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
      statusCode: 200
    })
    const { sut } = makeSut()

    const version = 'v4'

    await sut({
      payload: additionalDataPayloadMock.payload,
      options: additionalDataPayloadMock.options
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/${additionalDataPayloadMock.payload.id}/additional_data`,
      method: 'POST',
      body: additionalDataPayloadMock.formatted
    })
  })

  it('should not return a feedback message on successfully sent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const req = await sut({
      payload: additionalDataPayloadMock.payload,
      options: additionalDataPayloadMock.options
    })

    expect(req).toBeNull()
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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

      const request = sut({
        payload: additionalDataPayloadMock.payload,
        options: additionalDataPayloadMock.options
      })

      expect(request).rejects.toBe(expectedError)
    }
  )
})
