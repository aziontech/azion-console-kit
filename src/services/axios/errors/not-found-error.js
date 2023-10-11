export class NotFoundError extends Error {
  constructor() {
    super('Resource not found.')
    this.name = 'NotFoundError'
  }
}
