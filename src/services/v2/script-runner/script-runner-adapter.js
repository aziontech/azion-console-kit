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

export const ScriptRunnerAdapter = {
  transformLogsResponse(data) {
    const logs = data.logs ?? []
    const parsedLogs = logs.map((log, index) => formatLog(log, index))

    return {
      status: data.status,
      logs: parsedLogs
    }
  },

  transformStatusResponse(data) {
    return data
  },

  transformExecutionResultsResponse(data) {
    const result = data?.result || {}

    const transformedResult = {
      result: {
        domain: result.domain
          ? {
              id: result.domain.id,
              url: `https://${result.domain.url}`,
              cname: result.domain.url
            }
          : null,
        edgeApplication: result.edge_application
          ? {
              id: result.edge_application.id,
              name: result.edge_application.name
            }
          : null,
        extras: result.extras
      }
    }
    return transformedResult
  }
}
