import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getScriptRunnerResults } from '@/services/script-runner-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
    executionId: 'xx',
    deploymentFailed: {
        result: {
            error: true,
            message: 'deploy failed'
        }
    },
  }

const makeSut = () => {
  const sut = getScriptRunnerResults
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

    await sut(fixtures.executionId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `script-runner/executions/${fixtures.executionId}/results`,
      method: 'GET'
    })
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
})
