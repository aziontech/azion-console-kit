import { describe, it, expect } from 'vitest'
import {
  adaptBehavior,
  parsedBehavior
} from '@services/edge-application-rules-engine-services/helper-behavior'

describe('adaptBehavior', () => {
  it('should map behavior names to their corresponding IDs', () => {
    const behaviors = [
      { name: 'run_function', functionId: 'func123' },
      { name: 'set_origin', originId: 'origin456' },
      { name: 'set_cache_policy', cacheId: 'cache789' }
    ]

    const expected = [
      { name: 'run_function', target: 'func123' },
      { name: 'set_origin', target: 'origin456' },
      { name: 'set_cache_policy', target: 'cache789' }
    ]

    expect(adaptBehavior(behaviors)).toEqual(expected)
  })

  it('should handle capture_match_groups behavior correctly', () => {
    const behaviors = [
      {
        name: 'capture_match_groups',
        captured_array: 'array_cap',
        subject: 'subject',
        regex: 'regex'
      }
    ]

    const expected = [
      {
        name: 'capture_match_groups',
        target: {
          captured_array: 'array_cap',
          subject: 'subject',
          regex: 'regex'
        }
      }
    ]

    expect(adaptBehavior(behaviors)).toEqual(expected)
  })
})

describe('parsedBehavior', () => {
  it('should map behavior names to their corresponding IDs', () => {
    const behaviors = [
      { name: 'run_function', target: 'func123' },
      { name: 'set_origin', target: 'origin456' },
      { name: 'set_cache_policy', target: 'cache789' }
    ]

    const expected = [
      { name: 'run_function', functionId: 'func123' },
      { name: 'set_origin', originId: 'origin456' },
      { name: 'set_cache_policy', cacheId: 'cache789' }
    ]

    expect(parsedBehavior(behaviors)).toEqual(expected)
  })

  it('should handle capture_match_groups behavior correctly', () => {
    const behaviors = [
      {
        name: 'capture_match_groups',
        target: { captured_array: 'test', subject: 'subject', regex: 'regex' }
      }
    ]

    const expected = [
      {
        name: 'capture_match_groups',
        captured_array: 'test',
        subject: 'subject',
        regex: 'regex'
      }
    ]

    expect(parsedBehavior(behaviors)).toEqual(expected)
  })
})
