import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdgeDnsService,
  searchBotCategoryService,
  searchChallengeSolvedService,
  searchClassifiedService,
  searchActionService
} from '@/services/real-time-metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdgeDnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService,
  botCategoryIn: searchBotCategoryService,
  challengeSolvedEq: searchChallengeSolvedService,
  classifiedEq: searchClassifiedService,
  classifiedNe: searchClassifiedService,
  actionEq: searchActionService,
  actionNe: searchActionService
}

export default MAP_SERVICE_OPERATION
