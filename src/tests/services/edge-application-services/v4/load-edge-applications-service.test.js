import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeApplicationsService } from '@/services/edge-application-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationsMock: {
    id: 1736769496,
    name: 'adventurous-nosferatu updated',
    last_editor: 'test-UXE-3366@azion.com.br',
    last_modified: '2025-02-05T14:27:15.482948Z',
    product_version: '3.0',
    modules: {
      edge_cache_enabled: true,
      edge_functions_enabled: true,
      application_accelerator_enabled: true,
      image_processor_enabled: true,
      tiered_cache_enabled: false
    },
    active: false,
    debug: true
  }
}

const makeSut = () => {
  const sut = loadEdgeApplicationsService

  return {
    sut
  }
}

describe('EdgeApplicationServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.edgeApplicationsMock }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: fixtures.edgeApplicationsMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications/${fixtures.edgeApplicationsMock.id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly edge application', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.edgeApplicationsMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.edgeApplicationsMock.id })

    expect(result).toEqual({
      id: fixtures.edgeApplicationsMock.id,
      name: fixtures.edgeApplicationsMock.name,
      edgeCacheEnabled: fixtures.edgeApplicationsMock.modules.edge_cache_enabled,
      edgeFunctionsEnabled: fixtures.edgeApplicationsMock.modules.edge_functions_enabled,
      applicationAcceleratorEnabled:
        fixtures.edgeApplicationsMock.modules.application_accelerator_enabled,
      imageProcessorEnabled: fixtures.edgeApplicationsMock.modules.image_processor_enabled,
      tieredCacheEnabled: fixtures.edgeApplicationsMock.modules.tiered_cache_enabled,
      isActive: fixtures.edgeApplicationsMock.active,
      debug: fixtures.edgeApplicationsMock.debug
    })
  })
})
