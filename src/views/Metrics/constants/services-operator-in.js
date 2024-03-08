import {
  searchEdgeFunctionsService,
  searchDomainsService,
  searchEdnsService
} from '@/services/metrics-services'

const MAP_SERVICE_OPERATION = {
  configurationIdIn: searchDomainsService,
  zoneIdIn: searchEdnsService,
  edgeFunctionIdIn: searchEdgeFunctionsService
}

export default MAP_SERVICE_OPERATION
