const snakeToPascalCase = (str) => {
  return str.replace(/_([a-z])/g, function (_, letter) {
    return letter.toUpperCase()
  })
}

const pascalToSnakeCase = (str) => {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, function (_, letter) {
      return '_' + letter.toLowerCase()
    })
    .replace(/^_/, '')
}

export const parsePascalToSnake = (body) => {
  return Object.keys(body).reduce((acc, key) => {
    acc[pascalToSnakeCase(key)] = body[key]
    return acc
  }, {})
}

export const parseSnakeToPascal = (body) => {
  return Object.keys(body).reduce((acc, key) => {
    acc[snakeToPascalCase(key)] = body[key]
    return acc
  }, {})
}
