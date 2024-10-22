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
          'naxsiAttackFamilyIlike',
          'classifiedLike',
          'classifiedIlike',
          'classifiedIn',
          'classifiedNotIn',
          'classifiedIsNull',
          'actionLike',
          'actionIlike',
          'actionIn',
          'actionNotIn',
          'actionIsNull'
        ],
        FILTER_WHITELIST: {
          SUPPORTED_FILTER_TYPE: [
            'String',
            'Int',
            'Float',
            'IntRange',
            'FloatRange',
            'GenericScalar'
          ],
          FIELDS_LIKE: [
            'configurationIdIn',
            'zoneIdIn',
            'edgeFunctionIdIn',
            'botCategoryIn',
            'challengeSolvedEq'
          ]
        },
        MOST_RELEVANT_FIELDS: {
          httpMetrics: [
            'Domain',
            'Status',
            'Upstream Status',
            'Upstream Cache Status',
            'Request Time'
          ],
          httpEvents: [
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
          l2CacheEvents: [
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
          edgeFunctionsEvents: [
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
          imagesProcessedEvents: [
            'Domain',
            'Status',
            'Upstream Status',
            'Upstream Cache Status',
            'Request Time'
          ],
          idnsQueriesEvents: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
          idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
          dataStreamedEvents: [
            'Domain',
            'Data Streamed',
            'Endpoint Type',
            'Requests',
            'Configuration Id'
          ],
          dataStreamedMetrics: ['Domain', 'Status', 'Data Streamed', 'Endpoint Type', 'Requests']
        },
        FILTER_LIKE_TYPE: {
          configurationIdIn: 'ArrayObject',
          zoneIdIn: 'ArrayObject',
          edgeFunctionIdIn: 'ArrayObject',
          botCategoryIn: 'ArrayObject',
          challengeSolvedEq: 'Boolean',
          classifiedEq: 'StringObject',
          classifiedNe: 'StringObject',
          actionEq: 'StringObject',
          actionNe: 'StringObject',
        },
        FILTER_LIKE_ALIAS: {
          configurationIdIn: 'Domain',
          classifiedEq: 'Classified',
          classifiedNe: 'Classified',
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

    it('should order by the most relevant ', () => {
      const filters = [
        {
          label: 'Server Protocol',
          value: 'serverProtocol',
          mostRelevant: -1,
          operator: []
        },
        {
          label: 'Version',
          value: 'version',
          mostRelevant: -1,
          operator: []
        },
        {
          label: 'Solution',
          value: 'solution',
          mostRelevant: -1,
          operator: []
        },
        {
          label: 'Host',
          value: 'host',
          mostRelevant: -1,
          operator: []
        },
        {
          label: 'Request Time',
          value: 'requestTime',
          mostRelevant: 4,
          operator: []
        },
        {
          label: 'Request Method',
          value: 'requestMethod',
          mostRelevant: -1,
          operator: []
        },
        {
          label: 'Upstream Cache Status',
          value: 'upstreamCacheStatus',
          mostRelevant: 3,
          operator: []
        },
        {
          label: 'Upstream Status',
          value: 'upstreamStatus',
          mostRelevant: 2,
          operator: []
        },
        {
          label: 'Status',
          value: 'status',
          mostRelevant: 1,
          operator: []
        },
        {
          label: 'Upstream Response Time',
          value: 'upstreamResponseTime',
          mostRelevant: -1,
          operator: []
        }
      ]

      FILTERS_RULES.sortFields(filters)

      expect(filters).toEqual([
        {
          label: 'Status',
          mostRelevant: 1,
          operator: [],
          value: 'status'
        },
        {
          label: 'Upstream Status',
          mostRelevant: 2,
          operator: [],
          value: 'upstreamStatus'
        },
        {
          label: 'Upstream Cache Status',
          mostRelevant: 3,
          operator: [],
          value: 'upstreamCacheStatus'
        },
        {
          label: 'Request Time',
          mostRelevant: 4,
          operator: [],
          value: 'requestTime'
        },
        {
          label: 'Host',
          mostRelevant: -1,
          operator: [],
          value: 'host'
        },
        {
          label: 'Request Method',
          mostRelevant: -1,
          operator: [],
          value: 'requestMethod'
        },
        {
          label: 'Server Protocol',
          mostRelevant: -1,
          operator: [],
          value: 'serverProtocol'
        },
        {
          label: 'Solution',
          mostRelevant: -1,
          operator: [],
          value: 'solution'
        },
        {
          label: 'Upstream Response Time',
          mostRelevant: -1,
          operator: [],
          value: 'upstreamResponseTime'
        },
        {
          label: 'Version',
          mostRelevant: -1,
          operator: [],
          value: 'version'
        }
      ])
    })
  })
})
