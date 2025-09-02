export const EdgeAppErrorResponseAdapter = {
  transformListEdgeAppErrorResponse(data) {
    const response = data[0]
    const firstCode = response.error_responses.find((element, index) => {
      const notCodeAny = element.code !== 'any'

      if (notCodeAny) return

      response.error_responses.splice(index, 1)
      return !notCodeAny
    })

    response.error_responses.unshift({ ...firstCode })

    return {
      id: response.id,
      name: response.name,
      originId: response.origin_id?.toString(),
      errorResponses: response.error_responses.map((element) => {
        return {
          code: element.code?.toString(),
          timeout: element.timeout || 0,
          uri: element.uri,
          customStatusCode: element.custom_status_code
            ? Number(element.custom_status_code)
            : element.custom_status_code
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
