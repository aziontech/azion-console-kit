import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadScriptRunnerExecutionResultsService } from '@/services/script-runner-service'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  executionId: 'xx',
  deploymentFailed: {
    result: {
      errors: [],
      message: 'deploy failed'
    }
  },
  bodyResponse: {
    result: {
      domain: {
        id: 123,
        url: 'abc.map.azionedge.net'
      },
      edge_application: {
        id: 456,
        name: 'my-app'
      },
      extras: []
    }
  },
  formattedBodyResponse: {
    result: {
      domain: {
        id: 123,
        url: 'https://abc.map.azionedge.net'
      },
      edgeApplication: {
        id: 456,
        name: 'my-app'
      },
      extras: []
    }
  }
}

const makeSut = () => {
  const sut = loadScriptRunnerExecutionResultsService
  return {
    sut
  }
}

describe('ScriptRunnerServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.bodyResponse
    })
    const { sut } = makeSut()

    await sut(fixtures.executionId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `script-runner/executions/${fixtures.executionId}/results`,
      method: 'GET'
    })
  })

  it('should call format fields', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.bodyResponse
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.executionId)

    expect(result).toEqual(fixtures.formattedBodyResponse)
  })

  it('should throw exception when deploy result has an error', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.deploymentFailed
    })
    const { sut } = makeSut()

    const result = sut(fixtures.executionId)

    expect(result).rejects.toBe(fixtures.deploymentFailed.result.message)
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
