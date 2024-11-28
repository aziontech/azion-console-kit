import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeApplicationsService } from '@/services/edge-application-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationsMock: {
    id: 1239875,
    name: 'edge app AZ'
  }
}

const makeSut = () => {
  const sut = loadEdgeApplicationsService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.edgeApplicationsMock }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.edgeApplicationsMock.id)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications/${fixtures.edgeApplicationsMock.id}?fields=id,name`,
      method: 'GET'
    })
  })
})
