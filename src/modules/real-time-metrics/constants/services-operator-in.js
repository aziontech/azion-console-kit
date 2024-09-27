import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdgeDnsService,
  searchBotCategoryService
} from '@/services/real-time-metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdgeDnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService,
  botCategoryIn: searchBotCategoryService
}

export default MAP_SERVICE_OPERATION
