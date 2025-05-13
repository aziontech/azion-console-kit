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
    ordering: toSnakeCase(ordering),
    page: page?.toString(),
    page_size: pageSize?.toString(),
    fields,
    search
  }

  Object.entries(paramsMap)
    .filter(([_, value]) => value != null)
    .forEach(([key, value]) => params.set(key, value))

  return params.toString()
}