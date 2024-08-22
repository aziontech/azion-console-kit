import { describe, expect, it } from 'vitest'
import { FILTERS_RULES } from '@/helpers'

describe('RealTimeMetricsModule', () => {
  describe('Filter rules constants', () => {
    it('should be defined', () => {
      expect(FILTERS_RULES).toBeDefined()
    })

    it('should have the correct key:value pairs', () => {
      const filterRules = {
        FILTER_BLACK_LIST: [
          'clientId',
          'clientIdNe',
          'clientIdLike',
          'clientIdEq',
          'clientIdIlike',
          'naxsiAttackFamilyEq',
          'naxsiAttackFamilyNe',
          'naxsiAttackFamilyLike',
          'naxsiAttackFamilyIlike'
        ],
        FILTER_WHITELIST: {
          SUPPORTED_FILTER_TYPE: ['String', 'Int', 'Float', 'IntRange', 'FloatRange'],
          FIELDS_LIKE: ['configurationIdIn', 'zoneIdIn', 'edgeFunctionIdIn']
        },
        MOST_RELEVANT_FIELDS: {
          httpMetrics: [
            'Domain',
            'Status',
            'Upstream Status',
            'Upstream Cache Status',
            'Request Time'
          ],
          l2CacheMetrics: [
            'Upstream Bytes Received',
            'Status',
            'Upstream Status',
            'Upstream Cache Status',
            'Request Time'
          ],
          edgeFunctionsMetrics: [
            'Domain',
            'Edge Function Id',
            'Compute Time',
            'Invocations',
            'Edge Functions Instance Id List'
          ],
          imagesProcessedMetrics: [
            'Domain',
            'Status',
            'Upstream Status',
            'Upstream Cache Status',
            'Request Time'
          ],
          idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
          dataStreamedMetrics: ['Domain', 'Status', 'Data Streamed', 'Endpoint Type', 'Requests']
        },
        FILTER_LIKE_TYPE: {
          configurationIdIn: 'ArrayObject',
          zoneIdIn: 'ArrayObject',
          edgeFunctionIdIn: 'ArrayObject'
        },
        FILTER_LIKE_ALIAS: {
          configurationIdIn: 'Domain'
        },
        ALIAS_MAPPING: { configurationId: 'domain' }
      }

      expect(JSON.stringify(FILTERS_RULES)).toEqual(JSON.stringify(filterRules))
    })

    it('should return false if the field is blacklisted', () => {
      const blacklistedField = { name: 'clientId' }
      const result = FILTERS_RULES.verifyBlackListFields(blacklistedField)
      expect(result).toBeFalsy()
    })

    it('should return true if the field is not blacklisted', () => {
      const notBlacklistedField = { name: 'Domain' }
      const result = FILTERS_RULES.verifyBlackListFields(notBlacklistedField)
      expect(result).toBeTruthy()
    })

    it('should return true if the field type is supported', () => {
      const supportedField = { name: 'exampleField', type: { name: 'String' } }
      const result = FILTERS_RULES.verifyWhiteListFields(supportedField)
      expect(result).toBe(true)
    })

    it('should return true if the field name is in FIELDS_LIKE', () => {
      const fieldsLikeField = { name: 'configurationIdIn', type: { name: 'ArrayObject' } }
      const result = FILTERS_RULES.verifyWhiteListFields(fieldsLikeField)
      expect(result).toBe(true)
    })

    it('should return false if the field type is not supported and name is not in FIELDS_LIKE', () => {
      const unsupportedField = { name: 'unsupportedField', type: { name: 'UnsupportedType' } }
      const result = FILTERS_RULES.verifyWhiteListFields(unsupportedField)
      expect(result).toBe(false)
    })
  })
})
