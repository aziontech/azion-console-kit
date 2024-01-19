import { capitalizeFirstLetter } from '@/helpers'
import { describe, expect, it } from 'vitest'

const mockScenarios = [
  {
    input: 'test string',
    expected: 'Test string'
  },
  {
    input: 'Test string',
    expected: 'Test string'
  },
  {
    input: 'tEST STRING',
    expected: 'tEST STRING'
  },
  {
    input: 'testString',
    expected: 'TestString'
  }
]

describe('CapitalizeFirstLetter', () => {
  it.each(mockScenarios)(
    'should correctly capitalize the first letter of a string',
    ({ input, expected }) => {
      const result = capitalizeFirstLetter(input)
      expect(result).toEqual(expected)
    }
  )
})
