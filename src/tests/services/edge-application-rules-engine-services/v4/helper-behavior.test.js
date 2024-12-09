import { describe, it, expect } from 'vitest'
import {
  adaptBehavior,
  parsedBehavior
} from '@services/edge-application-rules-engine-services/v4/helper-behavior'

describe('adaptBehavior', () => {
  it('should map behavior names to their corresponding IDs', () => {
    const behaviors = [
      { name: 'run_function', functionId: 'func123' },
      { name: 'set_origin', originId: 'origin456' },
      { name: 'set_cache_policy', cacheId: 'cache789' }
    ]

    const expected = [
      { name: 'run_function', argument: 'func123' },
      { name: 'set_origin', argument: 'origin456' },
      { name: 'set_cache_policy', argument: 'cache789' }
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
        argument: {
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
      { name: 'run_function', argument: 'func123' },
      { name: 'set_origin', argument: 'origin456' },
      { name: 'set_cache_policy', argument: 'cache789' }
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
        argument: { captured_array: 'test', subject: 'subject', regex: 'regex' }
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
