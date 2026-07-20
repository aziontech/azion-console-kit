import { describe, it, expect } from 'vitest'
import Aql from '../azion-query-language.js'

const aql = new Aql()

/**
 * A query that ends with a dangling logical connector (`... AND` / `... OR`) is
 * incomplete: it must be flagged so Enter is a no-op and the Refresh/Update
 * button is disabled, instead of sending a malformed request to the API.
 */
describe('AQL — dangling logical operator validation', () => {
  const flags = (query) => aql.queryValidatorDanglingOperator(query).length > 0

  it('flags a query ending with AND/OR (with or without trailing space)', () => {
    expect(flags('status = 400 and')).toBe(true)
    expect(flags('status = 400 or')).toBe(true)
    expect(flags('status = 400 and ')).toBe(true)
  })

  it('does not flag a complete query', () => {
    expect(flags('status = 400')).toBe(false)
    expect(flags('status = 400 and host = a')).toBe(false)
    expect(flags('status = 400 or host = b')).toBe(false)
  })

  it('does not flag values that merely end in the letters and/or', () => {
    expect(flags('host = brand')).toBe(false)
  })

  it('surfaces a human-readable message through queryValidator', () => {
    const messages = aql.queryValidator('status = 400 and', [])
    expect(messages.some((msg) => /logical operator/i.test(msg))).toBe(true)
  })
})
