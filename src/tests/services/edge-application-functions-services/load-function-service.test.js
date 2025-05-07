import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadFunctionService } from '@/services/edge-application-functions-services/loader-function-service'
import { describe, expect, it, vi } from 'vitest'

const EDGE_APPLICATION_ID = '123'
const FUNCTION_ID = '456'

const fixture = {
  functionInstance: {
    id: FUNCTION_ID,
    edge_function_id: '789',
    name: 'function name',
    args: { key: 'value' }
  }
}

const makeSut = () => {
  const sut = loadFunctionService
  return { sut }
}

describe('LoaderFunctionService', () => {
  vi.restoreAllMocks()

  it('should call API with correct URL when loading a function instance', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixture.functionInstance }
    })
    const { sut } = makeSut()

    await sut({ edgeApplicationID: EDGE_APPLICATION_ID, functionID: FUNCTION_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${EDGE_APPLICATION_ID}/functions_instances/${FUNCTION_ID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned edge application function instance', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixture.functionInstance }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeApplicationID: EDGE_APPLICATION_ID, functionID: FUNCTION_ID })

    expect(result).toEqual({
      id: fixture.functionInstance.id,
      edgeFunctionID: fixture.functionInstance.edge_function_id,
      name: fixture.functionInstance.name,
      args: JSON.stringify(fixture.functionInstance.args, null, '\t')
    })
  })

  it('should handle and throw an error when the API call fails', async () => {
    const error = new Error('Network error')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(error)
    const { sut } = makeSut()

    await expect(
      sut({ edgeApplicationID: EDGE_APPLICATION_ID, functionID: FUNCTION_ID })
    ).rejects.toThrow('Network error')
  })
})
