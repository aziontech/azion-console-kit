const adaptServiceDataResponse = (data, fields, transforms) => {
  if (!data || !data.length) return []

  const keys =
    Array.isArray(fields) && fields.length
      ? fields
      : Object.keys(transforms).map((value) => transformCamelToSnake(value))

  return data.map((item) =>
    Object.fromEntries(
      keys.map((field) => {
        const fieldToCamel = transformSnakeToCamel(field)

        const value = transforms[fieldToCamel] ? transforms[fieldToCamel](item) : item[field]

        return [fieldToCamel, value]
      })
    )
  )
}

const adaptServiceDataResponseToLoad = (data, fields, transforms) => {
  if (!data || typeof data !== 'object') return {}

  const keys =
    Array.isArray(fields) && fields.length
      ? fields
      : Object.keys(transforms).map(transformCamelToSnake)

  return Object.fromEntries(
    keys.map((field) => {
      const fieldToCamel = transformSnakeToCamel(field)
      const isFunction = typeof transforms[fieldToCamel] === 'function'
      const value = isFunction ? transforms[fieldToCamel](data) : data[field]

      return [fieldToCamel, value]
    })
  )
}

export const transformSnakeToCamel = (value) => {
  // eslint-disable-next-line id-length
  return value.replace(/_([a-z])/g, (_, g) => g.toUpperCase())
}

export const transformCamelToSnake = (value) => {
  // eslint-disable-next-line id-length
  return value.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export { adaptServiceDataResponse, adaptServiceDataResponseToLoad }
