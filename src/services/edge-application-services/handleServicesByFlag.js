import * as EdgeApplicationsServiceV3 from '@/services/edge-application-services'
import * as EdgeApplicationsServiceV4 from '@/services/edge-application-services/v4'

import { hasFlagBlockApiV4 } from '@/composables/user-flag'

const getEdgeApplicationServices = (useV3ForSomeServices) => {
  const services = {
    listEdgeApplicationsService: EdgeApplicationsServiceV4.listEdgeApplicationsService,
    deleteEdgeApplicationService: EdgeApplicationsServiceV4.deleteEdgeApplicationService,
    createEdgeApplicationService: EdgeApplicationsServiceV4.createEdgeApplicationService,
    editEdgeApplicationService: EdgeApplicationsServiceV4.editEdgeApplicationsService,
    loadEdgeApplicationService: EdgeApplicationsServiceV4.loadEdgeApplicationsService,
    contactSalesEdgeApplicationService:
      EdgeApplicationsServiceV3.contactSalesEdgeApplicationService,
    loadEdgeApplicationsDropdownService:
      EdgeApplicationsServiceV4.loadEdgeApplicationsDropdownService
  }

  if (useV3ForSomeServices) {
    services.createEdgeApplicationService = EdgeApplicationsServiceV3.createEdgeApplicationService
    services.editEdgeApplicationService = EdgeApplicationsServiceV3.editEdgeApplicationService
    services.loadEdgeApplicationService = EdgeApplicationsServiceV3.loadEdgeApplicationService
  }

  return services
}

const useEdgeApplicationServices = () => {
  return getEdgeApplicationServices(hasFlagBlockApiV4())
}

export default useEdgeApplicationServices
