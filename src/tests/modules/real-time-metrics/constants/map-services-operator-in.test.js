import { describe, expect, it } from 'vitest'
import { MAP_SERVICE_OPERATION } from '@modules/real-time-metrics/constants'
import * as services from '@services/real-time-metrics-services'

describe('RealTimeMetricsModule', () => {
  describe('Operator in constants', () => {
    it('should be defined', () => {
      expect(MAP_SERVICE_OPERATION).toBeDefined()
    })

    it('should have the correct key:value pairs', () => {
      const mapServiceOperation = {
        configurationIdIn: services.searchDomainsService,
        zoneIdIn: services.searchEdgeDnsService,
        edgeFunctionIdIn: services.searchEdgeFunctionsService,
        botCategoryIn: services.searchBotCategoryService,
        challengeSolvedEq: services.searchChallengeSolvedService,
        classifiedEq: services.searchClassifiedService,
        classifiedNe: services.searchClassifiedService,
        actionEq: services.searchActionService,
        actionNe: services.searchActionService
      }

      expect(MAP_SERVICE_OPERATION).toEqual(mapServiceOperation)
    })
  })
})
