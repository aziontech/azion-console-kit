import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'

export const getScriptRunnerLogs = async (executionId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/${executionId}/logs`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedLogs = httpResponse.body.logs.map((log) => ({
    content: log.content,
    timeStamp: Intl.DateTimeFormat('us', {
      timeStyle: 'medium',
      hourCycle: 'h23'
    }).format(new Date(log.timestamp))
  }))

  return {
    body: {
      status: httpResponse.body.status,
      logs: parsedLogs
    },
    statusCode: httpResponse.statusCode
  }
}
