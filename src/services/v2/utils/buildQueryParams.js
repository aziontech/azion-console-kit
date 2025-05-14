const toSnakeCase = (str) => {
  if (!str) return ''
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
}

export const buildQueryParams = ({ fields, ordering, page, pageSize, search }) => {
  const params = new URLSearchParams()
  const paramsMap = {
    ...(ordering && { ordering: toSnakeCase(ordering) }),
    ...(page && { page: page?.toString() }),
    ...(pageSize && { page_size: pageSize?.toString() }),
    ...(fields && { fields }),
    ...(search && { search })
  }

  Object.entries(paramsMap)
    .filter((entry) => entry[1] != null)
    .forEach(([key, value]) => params.set(key, value))

  return params.toString()
}
