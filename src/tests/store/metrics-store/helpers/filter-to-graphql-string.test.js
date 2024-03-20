import FiltersToGraphQLString from '@modules/real-time-metrics/helpers/filter-to-graphql-string'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = FiltersToGraphQLString

  return { sut }
}

const scenarios = [
  {
    type: 'tsRange',
    key: 'tsRange',
    value: {
      begin: '$tsRange_begin',
      end: '$tsRange_end'
    },
    expected: 'tsRange: {\nbegin: $tsRange_begin\nend: $tsRange_end\n\n}\n'
  },
  {
    type: 'raw',
    key: 'status',
    value: {
      code: '200a'
    },
    expected: 'status: {\ncode: "200a"\n\n}\n'
  }
]

describe('Convert Report Meta To GQL', () => {
  it.each(scenarios)('should convert $type filter', ({ key, value, expected }) => {
    const { sut } = makeSut()

    const result = sut(key, value)

    expect(result).toBe(expected)
  })
})
