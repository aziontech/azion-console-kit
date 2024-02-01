import ParserObjectField from '@stores/metrics-store/helpers/parser-object-field'
import { describe, expect, it } from 'vitest'
import FIXTURE from './fixtures/parser-object-field-fixtures'

const makeSut = () => {
  const sut = ParserObjectField

  return { sut }
}

const scenarios = [
  {
    label: 'should map filter config correctly',
    field: FIXTURE.SCENARIO_FIELD_TYPE_CONFIGURATION.field,
    expected: FIXTURE.SCENARIO_FIELD_TYPE_CONFIGURATION.expected
  },
  {
    label: 'should handle range filter type',
    field: FIXTURE.SCENARIO_FIELD_TYPE_RANGE.field,
    expected: FIXTURE.SCENARIO_FIELD_TYPE_RANGE.expected
  }
]

describe('parserObjectField', () => {
  it.each(scenarios)('$label', ({ field, expected }) => {
    const { sut } = makeSut()

    const result = sut(field)

    expect(result).toEqual(expected)
  })
})
