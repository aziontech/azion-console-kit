const formatLog = (log) => ({
  content: log?.content,
  timeStamp: Intl.DateTimeFormat('us', {
    timeStyle: 'medium',
    hourCycle: 'h23'
  }).format(new Date(log.timestamp))
})

export const ScriptRunnerAdapter = {
  transformLogsResponse(data) {
    const logs = data.logs ?? []
    const parsedLogs = logs.map(formatLog)

    return {
      status: data.status,
      logs: parsedLogs
    }
  },

  transformStatusResponse(data) {
    return data
  },

  transformExecutionResultsResponse(data) {
    const { result } = data

    return {
      result: {
        domain: {
          id: result.domain.id,
          url: `https://${result.domain.url}`
        },
        edgeApplication: {
          id: result.edge_application.id,
          name: result.edge_application.name
        },
        extras: result.extras
      }
    }
  }
}
