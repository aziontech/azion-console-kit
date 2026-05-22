import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const parseItemResponse = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data) && data.data) {
    return data.data
  }

  return data
}

export class DeploymentResourceService extends BaseService {
  redeployResourceService = async (resourceVersionId, payload = {}) => {
    const body = {}
    if (payload.resource_type !== undefined) {
      body.resource_type = payload.resource_type
    }

    const { data } = await this.http.request({
      method: 'POST',
      url: `/deployment-api/v1/resources/${resourceVersionId}/redeploy`,
      body
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: parseItemResponse(data)
    }
  }
}

export const deploymentResourceService = new DeploymentResourceService()
