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
    status: 'failed'
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

  it('should parsed correctly all returned logs', async () => {
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
          id: expect.stringMatching(/^log-0-\d+$/),
          content: fixtures.logsResult.logs[0].content,
          timeStamp: fixtures.parsedTimeStamp,
          type: 'info'
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

  it('should detect error type when log contains "Error"', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        status: 'failed',
        logs: [{ content: 'Error: Something went wrong', timestamp: '2023-11-16 03:16:06.300' }]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result.logs[0].type).toBe('error')
  })

  it('should detect warning type when log contains "warning"', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        status: 'succeeded',
        logs: [{ content: 'Warning: deprecated feature', timestamp: '2023-11-16 03:16:06.300' }]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result.logs[0].type).toBe('warning')
  })

  it('should detect info type for regular logs', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        status: 'succeeded',
        logs: [{ content: 'Build completed', timestamp: '2023-11-16 03:16:06.300' }]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result.logs[0].type).toBe('info')
  })
})
