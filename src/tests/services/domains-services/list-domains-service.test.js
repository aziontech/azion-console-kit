import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDomainsService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = listDomainsService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `domains?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })
})
