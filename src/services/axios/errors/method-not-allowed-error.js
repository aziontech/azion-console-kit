export class MethodNotAllowedError extends Error {
  constructor() {
    super('Method not allowed.')
    this.name = 'MethodNotAllowedError'
  }
}
