import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listCategoriesService } from '@/services/marketplace-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  sample: {
    name: 'Security',
    slug: 'security',
    solutions_count: 24
  }
}

const makeSut = () => {
  const sut = listCategoriesService
  return { sut }
}

describe('MarketplaceServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'marketplace/categories/',
      method: 'GET'
    })
  })

  it('should parsed correctly each solution record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [fixtures.sample]
    })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        name: fixtures.sample.name,
        slug: fixtures.sample.slug,
        solutionsCount: fixtures.sample.solutions_count
      }
    ])
  })
})
