import * as EdgeApplicationsServiceV3 from '@/services/edge-application-services'
import * as EdgeApplicationsServiceV4 from '@/services/edge-application-services/v4'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

const useEdgeApplicationServices = () => {
  if (hasFlagBlockApiV4()) {
    return {
      createEdgeApplicationService: EdgeApplicationsServiceV3.createEdgeApplicationService,
      editEdgeApplicationService: EdgeApplicationsServiceV3.editEdgeApplicationService,
      loadEdgeApplicationService: EdgeApplicationsServiceV3.loadEdgeApplicationService,
      contactSalesEdgeApplicationService:
        EdgeApplicationsServiceV3.contactSalesEdgeApplicationService,
      checkgeApplicationsLockedService: EdgeApplicationsServiceV4.checkgeApplicationsLockedService
    }
  }
  return {
    contactSalesEdgeApplicationService: EdgeApplicationsServiceV3.contactSalesEdgeApplicationService
  }
}

export default useEdgeApplicationServices
