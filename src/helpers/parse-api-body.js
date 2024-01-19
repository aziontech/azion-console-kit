const snakeToCamelCase = (str) => {
  return str.replace(/_([a-z])/g, function (__, letter) {
    return letter.toUpperCase()
  })
}

const camelToSnakeCase = (str) => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
}

export const parseCamelToSnake = (body) => {
  return Object.keys(body).reduce((acc, key) => {
    acc[camelToSnakeCase(key)] = body[key]
    return acc
  }, {})
}

export const parseSnakeToCamel = (body) => {
  return Object.keys(body).reduce((acc, key) => {
    acc[snakeToCamelCase(key)] = body[key]
    return acc
  }, {})
}
