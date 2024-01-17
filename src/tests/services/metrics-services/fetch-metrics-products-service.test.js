import { fetchMetricsProductsService } from '@/services/metrics-services'
import { describe, expect, it } from 'vitest'

const fixtures = {
  build: [
    {
      id: 1,
      label: 'Edge Applications',
      groupId: 1
    },
    {
      id: 2,
      label: 'L2 Caching',
      groupId: 1
    },
    {
      id: 3,
      label: 'Edge Functions',
      groupId: 1
    },
    {
      id: 4,
      label: 'Image Processor',
      groupId: 1
    }
  ],
  secure: [
    {
      id: 6,
      label: 'WAF',
      groupId: 2
    },
    {
      id: 7,
      label: 'Intelligent DNS',
      groupId: 2
    }
  ],
  observe: [
    {
      id: 8,
      label: 'Data Streaming',
      groupId: 3
    }
  ]
}

const makeSut = () => {
  const sut = fetchMetricsProductsService

  return {
    sut
  }
}

describe('MetricsServices', () => {
  it.each(['build', 'secure', 'observe'])(
    'should return a list of products within %s group',
    async (prop) => {
      const { sut } = makeSut()

      const products = await sut(prop)

      expect(products).toEqual(fixtures[prop])
    }
  )

  it('should return an empty list on undefined group', async () => {
    const { sut } = makeSut()

    const products = await sut()

    expect(products).toEqual([])
  })
})
