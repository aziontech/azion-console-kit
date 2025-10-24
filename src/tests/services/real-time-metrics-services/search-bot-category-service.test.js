import { describe, expect, it } from 'vitest'
import { searchBotCategoryService } from '@/services/real-time-metrics-services/search-bot-category-service'

const makeSut = () => {
  const sut = searchBotCategoryService

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should return a list of bot categories', () => {
    const { sut } = makeSut()

    expect(sut()).toEqual([
      {
        label: 'Legitimate',
        value: 'legitimate'
      },
      {
        label: 'Good Bot',
        value: 'good bot'
      },
      {
        label: 'Bad Bot',
        value: 'bad bot'
      },
      {
        label: 'Under Evaluation',
        value: 'under evaluation'
      }
    ])
  })
})
