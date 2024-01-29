import { formatFieldName } from '@views/Metrics/utils/convert-metrics-fields'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-filter-fields'

const makeSut = () => {
  const sut = formatFieldName

  return { sut }
}

const scenarios = [
  {
    type: 'compound',
    fieldName: FIXTURES.formatField.fieldName,
    expected: FIXTURES.formatField.expected
  },
  {
    type: 'single',
    fieldName: FIXTURES.formatFieldSingle.fieldName,
    expected: FIXTURES.formatFieldSingle.expected
  }
]

describe('ConvertFields', () => {
  describe('#formatFieldName', () => {
    it.each(scenarios)(
      'should format the field with $type name to user readable sentence',
      ({ fieldName, expected }) => {
        const { sut } = makeSut()

        const result = sut(fieldName)

        expect(result).toEqual(expected)
      }
    )
  })
})
