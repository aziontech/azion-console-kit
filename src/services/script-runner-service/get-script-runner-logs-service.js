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

const detectLogType = (content) => {
  if (!content) return 'info'
  const lowerContent = content.toLowerCase()
  if (lowerContent.includes('error') || lowerContent.includes('err:')) {
    return 'error'
  }
  if (lowerContent.includes('warn') || lowerContent.includes('warning')) {
    return 'warning'
  }
  return 'info'
}

const formatLog = (log, index) => {
  const content = log?.content
  const type = detectLogType(content)
  return {
    id: `log-${index}-${Date.now()}`,
    content,
    timeStamp: Intl.DateTimeFormat('us', {
      timeStyle: 'medium',
      hourCycle: 'h23'
    }).format(new Date(log.timestamp)),
    type
  }
}

const adapt = (httpResponse) => {
  const logs = httpResponse.body.logs ?? []
  const parsedLogs = logs.map((log, index) => formatLog(log, index))

  return {
    body: {
      status: httpResponse.body.status,
      logs: parsedLogs
    },
    statusCode: httpResponse.statusCode
  }
}
