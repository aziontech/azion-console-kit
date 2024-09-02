import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadTeamPermissionService } from '@/services/team-permission'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  teamPermissionMock: {
    data: {
      id: 2,
      name: 'Default',
      is_active: true,
      permissions: [{ id: 324, name: 'permission' }]
    }
  }
}

const makeSut = () => {
  const sut = loadTeamPermissionService

  return {
    sut
  }
}

describe('TeamPermissionService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.teamPermissionMock
    })
    const teamPermissionMockId = 2
    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: teamPermissionMockId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/teams/${teamPermissionMockId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.teamPermissionMock
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.teamPermissionMock.id })

    expect(result).toEqual({
      id: fixtures.teamPermissionMock.data.id,
      name: fixtures.teamPermissionMock.data.name,
      isActive: fixtures.teamPermissionMock.data.is_active,
      permissions: fixtures.teamPermissionMock.data.permissions
    })
  })

  it('should throw when request fails with statusCode 403', async () => {
    const apiErrorMock = {
      error: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 403,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.teamPermissionMock)

    expect(apiErrorResponse).rejects.toBe(apiErrorMock.error)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
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
