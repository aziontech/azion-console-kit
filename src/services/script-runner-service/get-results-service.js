import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'

export const getResults = async (executionId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/${executionId}/results`,
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}
