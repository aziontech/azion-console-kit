import {
  parseCriteria,
  parseBehaviors
} from '@/services/edge-firewall-rules-engine-services/v4/parser-utils'
import { describe, expect, it } from 'vitest'

describe('parser-utils', () => {
  describe('parseCriteria', () => {
    it('should correctly parse criteria with network variable', () => {
      const criteria = [[{ variable: '${network}', argument: '100' }]]
      const expected = [[{ variable: '${network}', argument: 100 }]]
      expect(parseCriteria(criteria)).toEqual(expected)
    })

    it('should leave argument unchanged if variable does not match', () => {
      const criteria = [[{ variable: '${unknown}', argument: 'test' }]]
      const expected = [[{ variable: '${unknown}', argument: 'test' }]]
      expect(parseCriteria(criteria)).toEqual(expected)
    })
  })

  describe('parseBehaviors', () => {
    it('should correctly parse run_function behavior', () => {
      const behaviors = [{ name: 'run_function', functionId: 123 }]
      const expected = [{ name: 'run_function', argument: 123 }]
      expect(parseBehaviors(behaviors)).toEqual(expected)
    })

    it('should correctly parse set_waf_ruleset behavior', () => {
      const behaviors = [{ name: 'set_waf_ruleset', mode: 'block', waf_id: 1 }]
      const expected = [{ name: 'set_waf_ruleset', argument: { mode: 'block', id: 1 } }]
      expect(parseBehaviors(behaviors)).toEqual(expected)
    })

    it('should correctly parse set_rate_limit behavior with burst size', () => {
      const behaviors = [
        {
          name: 'set_rate_limit',
          type: 'second',
          limit_by: 'ip',
          average_rate_limit: '100',
          maximum_burst_size: '20'
        }
      ]
      const expected = [
        {
          name: 'set_rate_limit',
          argument: {
            type: 'second',
            limit_by: 'ip',
            average_rate_limit: 100,
            maximum_burst_size: 20
          }
        }
      ]
      expect(parseBehaviors(behaviors)).toEqual(expected)
    })

    it('should correctly parse set_custom_response behavior', () => {
      const behaviors = [
        {
          name: 'set_custom_response',
          status_code: '404',
          content_type: 'text/plain',
          content_body: 'Not found'
        }
      ]
      const expected = [
        {
          name: 'set_custom_response',
          argument: {
            status_code: '404',
            content_type: 'text/plain',
            content_body: 'Not found'
          }
        }
      ]
      expect(parseBehaviors(behaviors)).toEqual(expected)
    })
  })
})
