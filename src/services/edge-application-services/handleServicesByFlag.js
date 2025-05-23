import * as EdgeApplicationsServiceV3 from '@/services/edge-application-services'
import * as EdgeApplicationsServiceV4 from '@/services/edge-application-services/v4'

import { hasFlagBlockApiV4 } from '@/composables/user-flag'

const useEdgeApplicationServices = () => {
  if (hasFlagBlockApiV4()) {
    return {
      listEdgeApplicationsService: EdgeApplicationsServiceV4.listEdgeApplicationsService,
      deleteEdgeApplicationService: EdgeApplicationsServiceV4.deleteEdgeApplicationService,
      createEdgeApplicationService: EdgeApplicationsServiceV3.createEdgeApplicationService,
      editEdgeApplicationService: EdgeApplicationsServiceV3.editEdgeApplicationService,
      loadEdgeApplicationService: EdgeApplicationsServiceV3.loadEdgeApplicationService,
      contactSalesEdgeApplicationService:
        EdgeApplicationsServiceV3.contactSalesEdgeApplicationService,
      checkgeApplicationsLockedService: EdgeApplicationsServiceV4.checkgeApplicationsLockedService,
      loadEdgeApplicationsDropdownService:
        EdgeApplicationsServiceV4.loadEdgeApplicationsDropdownService
    }
  }
  return {
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
}

export default useEdgeApplicationServices
