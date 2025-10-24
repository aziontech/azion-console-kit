import {
  searchEdgeFunctionsService,
  searchEdgeDnsService,
  searchBotCategoryService,
  searchChallengeSolvedService,
  searchClassifiedService,
  searchActionService,
  searchWorkloadsService
} from '@/services/real-time-metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchWorkloadsService,
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
