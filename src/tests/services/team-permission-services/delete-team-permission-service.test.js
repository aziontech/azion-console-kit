import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteTeamPermissionService } from '@/services/team-permission'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteTeamPermissionService

  return {
    sut
  }
}

describe('TeamPermissionServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const environmentVariableIdMock = 765678
    const { sut } = makeSut()
    const version = 'v4'
    await sut(environmentVariableIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/teams/${environmentVariableIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const environmentVariableIdMock = 7816825367
    const { sut } = makeSut()

    const feedbackMessage = await sut(environmentVariableIdMock)

    expect(feedbackMessage).toBe('Team Permission successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
    },
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
      const environmentVariableIdStub = 7816825367
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(environmentVariableIdStub)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
