import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFunctionService } from '@/services/edge-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

const FUNCTION_ID = '456'

const fixture = {
  edgeFunction: {
    id: FUNCTION_ID,
    name: 'function name',
    json_args: { key: 'value' }
  }
}

const makeSut = () => {
  const sut = loadEdgeFunctionService
  return { sut }
}

describe('EdgeFunctionServices', () => {
  vi.restoreAllMocks()

  it('should call API with correct URL when loading an edge function', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixture.edgeFunction }
    })

    const { sut } = makeSut()

    await sut({ id: FUNCTION_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_functions/functions/${FUNCTION_ID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned edge function', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixture.edgeFunction }
    })
    const { sut } = makeSut()

    const result = await sut({ id: FUNCTION_ID })

    expect(result).toEqual({
      id: fixture.edgeFunction.id,
      name: fixture.edgeFunction.name,
      args: JSON.stringify(fixture.edgeFunction.json_args, null, '\t')
    })
  })

  it('should handle and throw an error when the API call fails', async () => {
    const error = new Error('Network error')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(error)
    const { sut } = makeSut()

    await expect(sut({ id: FUNCTION_ID })).rejects.toThrow('Network error')
  })
})
