import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { searchDomainsMetricsService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    domainLike: 'domainName'
  },
  resultMock: {
    results: [1, 2],
    totalPages: 5,
    statusCode: 200
  }

}

const makeSut = () => {
  const sut = searchDomainsMetricsService

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

    await sut(fixtures.domainMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `domains?page_size=20&nameLike=${fixtures.domainMock.domainLike}`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: fixtures.resultMock.statusCode,
      results: fixtures.resultMock.results,
      totalPages: fixtures.resultMock.totalPages
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.domainMock.domainLike)
    expect(result.results).toEqual(fixtures.resultMock.results)
    expect(result.totalPages).toEqual(fixtures.resultMock.totalPages)
  })
})
