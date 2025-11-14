import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listOriginsService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = listOriginsService

  return { sut }
}

describe('EdgeApplicationOriginsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/origins?order_by=origin_id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })
})
