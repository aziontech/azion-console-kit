import { describe, expect, it } from 'vitest'

import Aql from '@/components/base/advanced-filter-system/filterAQL/azion-query-language.js'
import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'

const makeSuggestions = () => {
  const { singularLabel } = TEXT_DOMAIN_WORKLOAD()

  return [
    {
      label: singularLabel,
      value: {
        operator: [
          {
            label: 'In',
            value: {
              value: 'In',
              type: 'String'
            }
          }
        ]
      }
    }
  ]
}

const makeDomains = () => [
  { label: 'string1', id: '1' },
  { label: 'string2', id: '2' },
  { label: 'domain', id: '3' }
]

describe('AQL - IN operator normalization and list parsing', () => {
  it.each([
    `${TEXT_DOMAIN_WORKLOAD().singularLabel} in(string1, string2)`,
    `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (string1, string2)`,
    `${TEXT_DOMAIN_WORKLOAD().singularLabel} IN(string1, string2)`,
    `${TEXT_DOMAIN_WORKLOAD().singularLabel} in( string1, string2 )`
  ])('should parse IN lists without creating empty tokens: %s', (query) => {
    const aql = new Aql()
    const suggestions = makeSuggestions()
    const domains = makeDomains()

    const parsed = aql.parse(query, suggestions, domains)

    expect(parsed).toHaveLength(1)
    expect(parsed[0].operator).toBeTruthy()
    expect(parsed[0].value).toEqual([
      { label: 'string1', value: '1' },
      { label: 'string2', value: '2' }
    ])
  })

  it('should not create empty first value when user starts typing: in(', () => {
    const aql = new Aql()

    const suggestion = { label: 'string1' }
    const base = `${TEXT_DOMAIN_WORKLOAD().singularLabel} in(`

    const res = aql.selectSuggestion(
      suggestion,
      base,
      'value',
      TEXT_DOMAIN_WORKLOAD().singularLabel
    )

    expect(res.query).toBe(`${base}string1)`)
  })

  it.each([
    {
      initial: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (,,)`,
      expected: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item)`
    },
    {
      initial: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (, item)`,
      expected: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item)`
    },
    {
      initial: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in ( , item )`,
      expected: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item)`
    },
    {
      initial: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (, , item)`,
      expected: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item)`
    },
    {
      initial: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item, , second)`,
      expected: `${TEXT_DOMAIN_WORKLOAD().singularLabel} in (item, second)`
    }
  ])(
    'should sanitize empty values and duplicated commas when inserting: $initial',
    ({ initial, expected }) => {
      const aql = new Aql()
      const suggestion = { label: 'item' }

      const res = aql.selectSuggestion(
        suggestion,
        initial,
        'value',
        TEXT_DOMAIN_WORKLOAD().singularLabel
      )

      expect(res.query).toBe(expected)
    }
  )

  it('should not treat an empty token before comma as a value in queryValidationForInOperator', () => {
    const aql = new Aql()
    const query = `${TEXT_DOMAIN_WORKLOAD().singularLabel} in(, string1)`

    const normalized = aql.normalizeQuery(query)
    const errors = aql.queryValidationForInOperator(normalized)

    expect(errors).toContain('in-operator-empty-value-error')
  })
})
