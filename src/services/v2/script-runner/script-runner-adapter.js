const safeJsonParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
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

  // The script-runner sometimes nests the upstream provider error inside
  // `result.errors.stack` as a (possibly double-encoded) JSON string. Mine the
  // most specific message available, falling back to the generic envelope fields.
  extractErrorMessage(result) {
    let parsedStack = result?.errors?.stack
    for (let attempt = 0; attempt < 2 && typeof parsedStack === 'string'; attempt++) {
      const next = safeJsonParse(parsedStack)
      if (next === null) break
      parsedStack = next
    }

    if (parsedStack && typeof parsedStack === 'object') {
      const fieldMessages = Array.isArray(parsedStack.errors)
        ? parsedStack.errors.map((err) => err?.message).filter(Boolean)
        : []
      if (fieldMessages.length) return fieldMessages.join('; ')
      if (parsedStack.message) return parsedStack.message
    }

    return result?.message || result?.errors?.message || 'Deployment failed with errors'
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
