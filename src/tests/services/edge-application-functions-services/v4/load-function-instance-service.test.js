import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadFunctionService } from '@/services/edge-application-functions-services/v4/load-function-instance-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationID: 1234567890,
  functionID: 987654,
  functionMock: {
    data: {
      id: 987654,
      edge_function: 456789,
      name: 'mockFunctionName',
      json_args: {
        key1: 'value1',
        key2: 'value2'
      }
    }
  }
}

const makeSut = () => {
  const sut = loadFunctionService
  return { sut }
}

describe('EdgeApplicationFunctionInstanceService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.functionMock
    })

    const { sut } = makeSut()
    await sut({
      edgeApplicationID: fixtures.edgeApplicationID,
      functionID: fixtures.functionID
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.edgeApplicationID}/functions/${fixtures.functionID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the function response', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.functionMock
    })

    const { sut } = makeSut()
    const result = await sut({
      edgeApplicationID: fixtures.edgeApplicationID,
      functionID: fixtures.functionID
    })

    expect(result).toEqual({
      id: fixtures.functionMock.data.id,
      edgeFunctionID: fixtures.functionMock.data.edge_function,
      name: fixtures.functionMock.data.name,
      args: JSON.stringify(fixtures.functionMock.data.json_args, null, '\t')
    })
  })

  it('should handle json_args parsing correctly', async () => {
    const customJsonArgs = {
      complex: {
        nested: {
          value: 123
        }
      }
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          ...fixtures.functionMock.data,
          json_args: customJsonArgs
        }
      }
    })

    const { sut } = makeSut()
    const result = await sut({
      edgeApplicationID: fixtures.edgeApplicationID,
      functionID: fixtures.functionID
    })

    expect(result).toEqual({
      id: fixtures.functionMock.data.id,
      edgeFunctionID: fixtures.functionMock.data.edge_function,
      name: fixtures.functionMock.data.name,
      args: JSON.stringify(customJsonArgs, null, '\t')
    })
  })
})
