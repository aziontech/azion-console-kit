import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdgeDnsService
} from '@/services/real-time-metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdgeDnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService
}

export default MAP_SERVICE_OPERATION
