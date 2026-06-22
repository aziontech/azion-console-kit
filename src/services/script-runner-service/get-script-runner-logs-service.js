import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'
import { sanitizeLogColors } from '@/helpers/sanitize-log-colors'

export const getScriptRunnerLogsService = async (executionId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/${executionId}/logs`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const detectLogType = (content) => {
  if (content?.includes('Error')) return 'error'
  if (content?.toLowerCase().includes('warning')) return 'warning'
  return 'info'
}

const formatLog = (log, index) => ({
  id: `log-${index}-${Date.now()}`,
  content: sanitizeLogColors(log?.content),
  timeStamp: Intl.DateTimeFormat('us', {
    timeStyle: 'medium',
    hourCycle: 'h23'
  }).format(new Date(log.timestamp)),
  type: detectLogType(log?.content)
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
