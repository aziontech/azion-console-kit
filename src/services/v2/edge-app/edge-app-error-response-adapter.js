export const EdgeAppErrorResponseAdapter = {
  transformListEdgeAppErrorResponse(data) {
    const response = data[0]

    const anyCodeIndex = response.error_responses.findIndex((element) => element.code === 'any')
    const errorResponsesList = [...response.error_responses]

    if (anyCodeIndex !== -1) {
      const [anyCode] = errorResponsesList.splice(anyCodeIndex, 1)
      errorResponsesList.unshift(anyCode)
    }

    return {
      id: response.id,
      name: response.name,
      originId: response.origin_id ? response.origin_id.toString() : null,
      errorResponses: errorResponsesList.map((element) => {
        return {
          code: element.code ? element.code.toString() : '',
          timeout: element.timeout || 0,
          uri: element.uri || '',
          customStatusCode: element.custom_status_code ? element.custom_status_code.toString() : ''
        }
      })
    }
  },
  transformPayloadEditEdgeAppErrorResponse(payload) {
    const errorResponses = []
    payload.errorResponses.forEach((element) => {
      if (element.code === 'any') {
        errorResponses.unshift({
          custom_status_code: element.customStatusCode?.toString() || null,
          uri: element.uri || null,
          timeout: element.timeout,
          code: element.code
        })
      } else {
        errorResponses.push({
          custom_status_code: element.customStatusCode?.toString() || null,
          uri: element.uri || null,
          timeout: element.timeout,
          code: element.code
        })
      }
    })
    return {
      origin_id: payload.originId,
      error_responses: errorResponses
    }
  }
}
