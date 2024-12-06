import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadFunctionService } from '@/services/edge-firewall-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

// Constantes para reutilização
const EDGE_FIREWALL_ID = '123'
const FUNCTION_ID = '456'

const fixture = {
  functionInstance: {
    id: FUNCTION_ID,
    edge_function: '789',
    name: 'function name',
    json_args: { key: 'value' }
  }
}

const makeSut = () => {
  const sut = loadFunctionService
  return { sut }
}

describe('EdgeFirewallFunctionsServicesV4', () => {
  vi.restoreAllMocks()

  it('should call API with correct URL when loading a function instance', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixture.functionInstance }
    })
    const { sut } = makeSut()

    await sut({ edgeFirewallID: EDGE_FIREWALL_ID, functionID: FUNCTION_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${EDGE_FIREWALL_ID}/functions/${FUNCTION_ID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned edge firewall function instance', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixture.functionInstance }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallID: EDGE_FIREWALL_ID, functionID: FUNCTION_ID })

    expect(result).toEqual({
      id: fixture.functionInstance.id,
      edgeFunctionID: fixture.functionInstance.edge_function,
      name: fixture.functionInstance.name,
      args: JSON.stringify(fixture.functionInstance.json_args, null, '\t')
    })
  })

  it('should handle and throw an error when the API call fails', async () => {
    const error = new Error('Network error')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(error)
    const { sut } = makeSut()

    await expect(
      sut({ edgeApplicationID: EDGE_FIREWALL_ID, functionID: FUNCTION_ID })
    ).rejects.toThrow('Network error')
  })
})
