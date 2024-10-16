import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdgeDnsService,
  searchBotCategoryService,
  searchClassifiedService
} from '@/services/real-time-metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdgeDnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService,
  botCategoryIn: searchBotCategoryService,
  challengeSolvedEq: searchClassifiedService
}

export default MAP_SERVICE_OPERATION
