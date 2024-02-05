import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchIdnsService
} from '@/services/metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchIdnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService
}

export default MAP_SERVICE_OPERATION
