import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { inviteYourTeamService } from '@/services/users-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  guest: {
    name: 'Jack Caffe',
    email: 'jackcaffe@bmail.com',
    team: 10
  }
}

const makeSut = () => {
  const sut = inviteYourTeamService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.guest)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/users`,
      method: 'POST',
      body: {
        first_name: 'Jack',
        last_name: 'Caffe',
        email: fixtures.guest.email,
        teams_ids: [fixtures.guest.team]
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.guest)

    expect(feedbackMessage).toBe('Invite sent successfully')
  })

  it.each([
    {
      errorKey: 'first_name',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'last_name',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'email',
      apiErrorMock: 'Enter a valid email address',
      status: 400
    },
    {
      errorKey: 'teams_ids',
      apiErrorMock: 'This list should not be empty for non-owner users.',
      status: 400
    },
    {
      errorKey: 'unmapped_key',
      apiErrorMock: 'testing unmapped key',
      status: 400
    }
  ])(
    'Should return an API error for an key $errorKey',
    async ({ errorKey, apiErrorMock, status }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: status,
        body: { [errorKey]: [apiErrorMock] }
      })
      const { sut } = makeSut()

      const feedbackMessage = sut(fixtures.guest)

      expect(feedbackMessage).rejects.toThrow(apiErrorMock)
    }
  )

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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.guest)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
