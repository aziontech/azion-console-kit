import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadResourcesServices } from '@/services/edge-service-resources-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: 1239875,
    name: 'Edge Service A',
    trigger: 'some trigger',
    content_type: 'some content type',
    last_editor: 'az editor'
  }
}

const makeSut = () => {
  const sut = loadResourcesServices

  return {
    sut
  }
}

describe('EdgeServiceResourcesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })
    const id = 812783
    const edgeServiceId = 7879123
    const { sut } = makeSut()

    await sut({
      id,
      edgeServiceId
    })
    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_services/${edgeServiceId}/resources/${id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly an resource', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mock
    })
    const dnsRecordMockId = 812783
    const intelligentDNSMockId = 7879123
    const { sut } = makeSut()

    const result = await sut({
      id: dnsRecordMockId,
      intelligentDNSId: intelligentDNSMockId
    })

    expect(result).toEqual({
      id: fixtures.mock.id,
      name: fixtures.mock.name,
      trigger: fixtures.mock.trigger,
      contentType: fixtures.mock.content_type,
      lastEditor: fixtures.mock.last_editor
    })
  })
})
