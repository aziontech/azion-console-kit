export class KeyBuilder {
  build(method, url, identifier) {
    return `${method.toUpperCase()}|${url}|${identifier || ''}`
  }
}
