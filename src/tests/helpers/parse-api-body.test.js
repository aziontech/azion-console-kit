import { describe, expect, it } from 'vitest'
import { parseCamelToSnake, parseSnakeToCamel } from '@/helpers'

const camelCaseBodyMock = { testKey: '' }
const snakeCaseBodyMock = { test_key: '' }

describe('ParseApiBody', () => {
  it('should correctly parse camelCase to snake_case', () => {
    const parsedBody = parseCamelToSnake(camelCaseBodyMock)
    expect(parsedBody).toEqual(snakeCaseBodyMock)
  })

  it('should correctly parse snake_case to camelCase', () => {
    const parsedBody = parseSnakeToCamel(snakeCaseBodyMock)
    expect(parsedBody).toEqual(camelCaseBodyMock)
  })
})
