import { describe, expect, it } from 'vitest'
import {
  AGGREGATION_OPERATORS,
  isAggregationOperator,
  stripAggregationOperators
} from '@/services/real-time-events-service/_shared/aggregation-operators'

describe('aggregation-operators', () => {
  it('exposes the six operators documented by the Azion GraphQL API', () => {
    // Reference: https://www.azion.com/en/documentation/devtools/graphql-api/queries/
    expect(AGGREGATION_OPERATORS.has('count')).toBe(true)
    expect(AGGREGATION_OPERATORS.has('sum')).toBe(true)
    expect(AGGREGATION_OPERATORS.has('max')).toBe(true)
    expect(AGGREGATION_OPERATORS.has('min')).toBe(true)
    expect(AGGREGATION_OPERATORS.has('avg')).toBe(true)
    expect(AGGREGATION_OPERATORS.has('rate')).toBe(true)
    expect(AGGREGATION_OPERATORS.size).toBe(6)
  })

  it('isAggregationOperator recognises operators and rejects row fields', () => {
    expect(isAggregationOperator('count')).toBe(true)
    expect(isAggregationOperator('avg')).toBe(true)
    expect(isAggregationOperator('host')).toBe(false)
    expect(isAggregationOperator('requestTime')).toBe(false)
    expect(isAggregationOperator('')).toBe(false)
  })

  it('stripAggregationOperators removes every operator while keeping row fields', () => {
    const input = [
      'count',
      'bytesSent',
      'sum',
      'host',
      'avg',
      'httpReferer',
      'max',
      'min',
      'requestUri',
      'rate'
    ]
    expect(stripAggregationOperators(input)).toEqual([
      'bytesSent',
      'host',
      'httpReferer',
      'requestUri'
    ])
  })

  it('stripAggregationOperators drops falsy and non-string entries', () => {
    expect(stripAggregationOperators([null, undefined, '', 0, 'host'])).toEqual(['host'])
  })

  it('stripAggregationOperators accepts null / undefined without throwing', () => {
    expect(stripAggregationOperators(null)).toEqual([])
    expect(stripAggregationOperators(undefined)).toEqual([])
  })

  it('stripAggregationOperators is a pure function (does not mutate input)', () => {
    const input = ['count', 'host']
    const output = stripAggregationOperators(input)
    expect(input).toEqual(['count', 'host'])
    expect(output).toEqual(['host'])
  })
})
