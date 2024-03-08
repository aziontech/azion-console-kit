import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdgeDnsService
} from '@/services/metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdgeDnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService
}

export default MAP_SERVICE_OPERATION
