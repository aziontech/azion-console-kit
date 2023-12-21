export const getFirstApiError = (body) => {
  for (let key in body) {
    if (Array.isArray(body[key]) && body[key].length > 0) {
      return body[key][0]
    }
  }
  return null
}