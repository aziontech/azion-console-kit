import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFunctionService } from '@/services/edge-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

const FUNCTION_ID = '456'
const MOCK_DATE = '2024-03-20T10:00:00Z'

const fixture = {
  edgeFunction: {
    id: FUNCTION_ID,
    name: 'function name',
    json_args: { key: 'value' },
    active: true,
    language: 'javascript',
    initiator_type: 'http',
    last_editor: 'john.doe@example.com',
    reference_count: 2,
    code: 'console.log("Hello")',
    version: '1.0.0',
    last_modified: MOCK_DATE,
    is_proprietary_code: false
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
      id: FUNCTION_ID,
      name: 'function name',
      args: JSON.stringify({ key: 'value' }, null, 2),
      active: true,
      language: 'javascript',
      initiatorType: 'http',
      lastEditor: 'john.doe@example.com',
      referenceCount: 2,
      code: 'console.log("Hello")',
      version: '1.0.0',
      modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(MOCK_DATE)),
      statusTag: {
        content: 'Active',
        severity: 'success'
      },
      languageIcon: {
        content: 'JavaScript',
        icon: 'javascript'
      },
      isProprietaryCode: false
    })
  })

  it('should handle inactive status correctly', async () => {
    const inactiveFunction = {
      ...fixture.edgeFunction,
      active: false
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: inactiveFunction }
    })

    const { sut } = makeSut()
    const result = await sut({ id: FUNCTION_ID })

    expect(result.statusTag).toEqual({
      content: 'Inactive',
      severity: 'danger'
    })
  })

  it('should handle and throw an error when the API call fails', async () => {
    const error = new Error('Network error')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(error)
    const { sut } = makeSut()

    await expect(sut({ id: FUNCTION_ID })).rejects.toThrow('Network error')
  })
})
