import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWorkloadsDeploymentBaseUrl } from '@/services/workload-deployment-service/make-workload-deployment-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'
export const editWorkloadDeploymentService = async ({ domainId, payload, all = false }) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsDeploymentBaseUrl()}/${domainId}/deployments/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload, all)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload, all) => {
  if (all) {
    return payload.map((workload) => ({
      edge_application: workload.edgeApplication,
      edge_firewall: workload?.edgeFirewall || null
    }))
  }
  return {
    binds: {
      edge_application: payload.edgeApplication,
      edge_firewall: payload?.edgeFirewall || null
    }
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Your Workload deployment has been edited'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
