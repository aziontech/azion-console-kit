import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const deleteRulesEngineService = async (ruleId, phase, id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/rules_engine/${phase}/${ruleId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
