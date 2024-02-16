export const errorMsg = (httpResponse) => {
  let apiError = ''
  const keys = Object.keys(httpResponse)

  for (const keyError of keys) {
    if (Array.isArray(httpResponse[keyError])) {
      const errorValue = httpResponse[keyError][0]
      if (typeof errorValue === 'string') {
        apiError = errorValue
        break
      }
      if (typeof errorValue === 'object') {
        apiError = errorValue.message[0]
        break
      }
    }
  }

  return apiError
}
