import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createTeamPermissionsService } from '@/services/team-permission'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  teamPermissionMock: {
    name: 'Mongo-DB-Key',
    isActive: true,
    permissions: [
      { id: 1, name: 'default name' },
      { id: 2, name: 'default name' }
    ]
  }
}

const makeSut = () => {
  const sut = createTeamPermissionsService

  return {
    sut
  }
}

describe('TeamPermissionServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.teamPermissionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `teams`,
      method: 'POST',
      body: {
        name: fixtures.teamPermissionMock.name,
        is_active: fixtures.teamPermissionMock.isActive,
        permissions_ids: fixtures.teamPermissionMock.permissions.map((item) => item.id)
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.teamPermissionMock)

    expect(feedbackMessage).toBe('Your Team Permission has been created')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'name'
    const apiErrorMock = 'This field is required.'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.teamPermissionMock)

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

      const response = sut(fixtures.teamPermissionMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
