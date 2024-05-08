import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'

export const getScriptRunnerLogsService = async (executionId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/${executionId}/logs`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const formatLog = (log) => ({
  content: log?.content,
  timeStamp: Intl.DateTimeFormat('us', {
    timeStyle: 'medium',
    hourCycle: 'h23'
  }).format(new Date(log.timestamp))
})

const adapt = (httpResponse) => {
  const logs = httpResponse.body.logs ?? []
  const parsedLogs = logs.map(formatLog)

  return {
    body: {
      status: httpResponse.body.status,
      logs: parsedLogs
    },
    statusCode: httpResponse.statusCode
  }
}
