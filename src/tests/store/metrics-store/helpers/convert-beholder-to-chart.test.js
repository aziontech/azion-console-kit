import '@/helpers/convert-date'
import ConvertBeholderToChart from '@/modules/real-time-metrics/helpers/convert-beholder-to-chart'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-beholder-to-chart-fixtures'

const makeSut = () => {
  const sut = ConvertBeholderToChart

  return { sut }
}

const mockScenarios = [
  {
    type: 'with all filters',
    params: FIXTURES.allFilters.params,
    result: FIXTURES.allFilters.result
  },
  {
    type: 'with isTopX',
    params: FIXTURES.isTopX.params,
    result: FIXTURES.isTopX.result
  },
  {
    type: 'with variables',
    params: FIXTURES.withVariable.params,
    result: FIXTURES.withVariable.result
  },
  {
    type: 'without groupBy',
    params: FIXTURES.withoutGroupBy.params,
    result: FIXTURES.withoutGroupBy.result
  }
]

describe('ConvertBeholderToChart', () => {
  it.each(mockScenarios)('should convert $type', ({ params, result }) => {
    const { sut } = makeSut()
    const transformedData = sut(params)

    expect(transformedData).toEqual(result)
  })
})
