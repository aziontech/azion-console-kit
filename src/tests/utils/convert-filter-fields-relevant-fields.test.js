import { isRelevantField } from '@/views/RealTimeMetrics/utils/convert-metrics-fields'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-filter-fields'

const makeSut = () => {
  const sut = isRelevantField

  return { sut }
}

const scenarios = [
  {
    type: 'index of relevant field in dataset',
    fieldName: FIXTURES.isRelevantField.fieldName,
    dataset: FIXTURES.isRelevantField.dataset,
    expected: FIXTURES.isRelevantField.expected
  },
  {
    type: '-1 when dataset passed did not exists',
    fieldName: FIXTURES.isRelevantFieldNotExists.fieldName,
    dataset: FIXTURES.isRelevantFieldNotExists.dataset,
    expected: FIXTURES.isRelevantFieldNotExists.expected
  }
]

describe('ConvertFields', () => {
  describe('#isRelevantField', () => {
    it.each(scenarios)('should return $type', ({ fieldName, dataset, expected }) => {
      const { sut } = makeSut()

      const result = sut(fieldName, dataset)

      expect(result).toEqual(expected)
    })
  })
})
