import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getScriptRunnerLogsService } from '@/services/script-runner-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  logsResult: {
    status: 'succeeded',
    logs: [
      {
        content: 'Hello World',
        timestamp: '2023-11-16 03:16:06.300'
      }
    ]
  },
  noLogsResult: {
    status: 'failed',
  },
  parsedTimeStamp: '03:16:06',
  executionId: 'xx'
}

const makeSut = () => {
  const sut = getScriptRunnerLogsService

  return {
    sut
  }
}

describe('ScriptRunnerServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { logs: [], status: null }
    })
    const { sut } = makeSut()

    await sut(fixtures.executionId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `script-runner/executions/${fixtures.executionId}/logs`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.logsResult
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      status: fixtures.logsResult.status,
      logs: [
        {
          content: fixtures.logsResult.logs[0].content,
          timeStamp: fixtures.parsedTimeStamp
        }
      ]
    })
  })

  it('should return empty array if no logs', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.noLogsResult
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      status: fixtures.noLogsResult.status,
      logs: []
    })
  })
})
