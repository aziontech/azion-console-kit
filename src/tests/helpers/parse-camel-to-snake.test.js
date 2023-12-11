import { describe, expect, it } from 'vitest'
import { parseCamelToSnake } from '@/helpers'

const camelCaseBodyMock = { testKey: '' }
const snakeCaseBodyMock = { test_key: '' }

describe('ParseCamelToSnake', () => {
  it('should correctly parse camelCase to snake_case', () => {
    const parsedBody = parseCamelToSnake(camelCaseBodyMock)
    expect(parsedBody).toEqual(snakeCaseBodyMock)
  })
})
