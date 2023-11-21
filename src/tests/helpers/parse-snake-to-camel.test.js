import { describe, expect, it } from 'vitest'
import { parseSnakeToCamel } from '@/helpers'

const camelCaseBodyMock = { testKey: '' }
const snakeCaseBodyMock = { test_key: '' }

describe('ParseSnakeToCamel', () => {
  it('should correctly parse snake_case to camelCase', () => {
    const parsedBody = parseSnakeToCamel(snakeCaseBodyMock)
    expect(parsedBody).toEqual(camelCaseBodyMock)
  })
})
