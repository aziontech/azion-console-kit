import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { checkStatusScriptRunnerService } from '@/services/script-runner-service'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  solution: {
    uuid: '518f255f-939f-49e2-b007-641ad00e437a'
  },
  started: {
    status: 'started'
  }
}

const makeSut = () => {
  const sut = checkStatusScriptRunnerService
  return {
    sut
  }
}

describe('ScriptRunnerServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { result: {}, status: null }
    })
    const { sut } = makeSut()

    await sut(fixtures.solution.uuid)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `script-runner/executions/${fixtures.solution.uuid}/status`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.started
    })

    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      status: 'started'
    })
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

      const response = sut(fixtures.networkMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
